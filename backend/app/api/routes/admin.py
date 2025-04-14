from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.api.deps import get_db, get_current_admin_user
from app.db.models import Usuario, Guia, Pagamento, StatusPagamento
from app.schemas.admin import DashboardStats, AdminGuiaList, AdminPagamentoList

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    current_admin: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obter estatísticas para o dashboard administrativo.
    Apenas usuários administradores podem acessar esta rota.
    """
    # Total de usuários
    total_usuarios = db.query(func.count(Usuario.id)).scalar()
    
    # Total de guias
    total_guias = db.query(func.count(Guia.id)).scalar()
    
    # Guias por status
    guias_por_status = db.query(
        Guia.status, 
        func.count(Guia.id)
    ).group_by(Guia.status).all()
    
    guias_status_dict = {status: count for status, count in guias_por_status}
    
    # Total de pagamentos
    total_pagamentos = db.query(func.count(Pagamento.id)).scalar()
    
    # Pagamentos por status
    pagamentos_por_status = db.query(
        Pagamento.status, 
        func.count(Pagamento.id)
    ).group_by(Pagamento.status).all()
    
    pagamentos_status_dict = {status.name: count for status, count in pagamentos_por_status}
    
    # Valor total de pagamentos recebidos
    valor_total_recebido = db.query(
        func.sum(Pagamento.valor)
    ).filter(Pagamento.status == StatusPagamento.PAGO).scalar() or 0
    
    # Valor total de taxas de serviço
    valor_total_taxas = db.query(
        func.sum(Guia.valor_contribuicao * 0.1)
    ).filter(Guia.status == "PAGA_INSS").scalar() or 0
    
    # Guias geradas nos últimos 30 dias
    data_limite = datetime.now() - timedelta(days=30)
    guias_ultimos_30_dias = db.query(
        func.count(Guia.id)
    ).filter(Guia.created_at >= data_limite).scalar()
    
    # Novos usuários nos últimos 30 dias
    usuarios_ultimos_30_dias = db.query(
        func.count(Usuario.id)
    ).filter(Usuario.created_at >= data_limite).scalar()
    
    return {
        "total_usuarios": total_usuarios,
        "total_guias": total_guias,
        "guias_por_status": guias_status_dict,
        "total_pagamentos": total_pagamentos,
        "pagamentos_por_status": pagamentos_status_dict,
        "valor_total_recebido": float(valor_total_recebido),
        "valor_total_taxas": float(valor_total_taxas),
        "guias_ultimos_30_dias": guias_ultimos_30_dias,
        "usuarios_ultimos_30_dias": usuarios_ultimos_30_dias
    }

@router.get("/guias", response_model=List[AdminGuiaList])
def list_all_guias(
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    current_admin: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Listar todas as guias com opção de filtro por status.
    Apenas usuários administradores podem acessar esta rota.
    """
    query = db.query(Guia).join(Usuario, Guia.usuario_id == Usuario.id)
    
    if status:
        query = query.filter(Guia.status == status)
    
    guias = query.offset(skip).limit(limit).all()
    
    result = []
    for guia in guias:
        usuario = db.query(Usuario).filter(Usuario.id == guia.usuario_id).first()
        
        # Buscar pagamento associado
        pagamento = db.query(Pagamento).filter(Pagamento.guia_id == guia.id).first()
        
        result.append({
            "id": guia.id,
            "usuario": {
                "id": usuario.id,
                "nome": usuario.nome,
                "cpf": usuario.cpf,
                "email": usuario.email
            },
            "competencia": guia.competencia,
            "categoria": guia.categoria,
            "salario_contribuicao": guia.salario_contribuicao,
            "valor_contribuicao": guia.valor_contribuicao,
            "codigo_pagamento": guia.codigo_pagamento,
            "status": guia.status,
            "data_vencimento": guia.data_vencimento,
            "data_pagamento_usuario": guia.data_pagamento_usuario,
            "data_pagamento_inss": guia.data_pagamento_inss,
            "guia_url": guia.guia_url,
            "nota_fiscal_url": guia.nota_fiscal_url,
            "created_at": guia.created_at,
            "pagamento": {
                "id": pagamento.id if pagamento else None,
                "status": pagamento.status.name if pagamento else None,
                "valor": pagamento.valor if pagamento else None,
                "paid_at": pagamento.paid_at if pagamento else None
            } if pagamento else None
        })
    
    return result

@router.get("/pagamentos", response_model=List[AdminPagamentoList])
def list_all_pagamentos(
    status: StatusPagamento = None,
    skip: int = 0,
    limit: int = 100,
    current_admin: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Listar todos os pagamentos com opção de filtro por status.
    Apenas usuários administradores podem acessar esta rota.
    """
    query = db.query(Pagamento).join(Guia, Pagamento.guia_id == Guia.id)
    
    if status:
        query = query.filter(Pagamento.status == status)
    
    pagamentos = query.offset(skip).limit(limit).all()
    
    result = []
    for pagamento in pagamentos:
        guia = db.query(Guia).filter(Guia.id == pagamento.guia_id).first()
        usuario = db.query(Usuario).filter(Usuario.id == guia.usuario_id).first()
        
        result.append({
            "id": pagamento.id,
            "guia_id": pagamento.guia_id,
            "usuario": {
                "id": usuario.id,
                "nome": usuario.nome,
                "cpf": usuario.cpf,
                "email": usuario.email
            },
            "valor": pagamento.valor,
            "status": pagamento.status.name,
            "txid": pagamento.txid,
            "qrcode_url": pagamento.qrcode_url,
            "created_at": pagamento.created_at,
            "expires_at": pagamento.expires_at,
            "paid_at": pagamento.paid_at,
            "guia": {
                "competencia": guia.competencia,
                "categoria": guia.categoria,
                "valor_contribuicao": guia.valor_contribuicao,
                "status": guia.status
            }
        })
    
    return result

@router.post("/guias/{guia_id}/pagar-inss", response_model=Dict[str, Any])
def pagar_guia_inss_manual(
    guia_id: int,
    current_admin: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Marcar uma guia como paga ao INSS manualmente.
    Apenas usuários administradores podem acessar esta rota.
    """
    guia = db.query(Guia).filter(Guia.id == guia_id).first()
    
    if not guia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guia não encontrada"
        )
    
    if guia.status != "PAGA_USUARIO":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A guia deve estar com status 'PAGA_USUARIO' para ser marcada como paga ao INSS"
        )
    
    # Atualizar status da guia
    guia.status = "PAGA_INSS"
    guia.data_pagamento_inss = datetime.now()
    
    db.commit()
    
    # Enfileirar tarefa para emitir nota fiscal
    from app.tasks.nota_fiscal_tasks import emitir_nota_fiscal
    emitir_nota_fiscal.delay(guia.id)
    
    return {
        "message": "Guia marcada como paga ao INSS com sucesso",
        "guia_id": guia.id,
        "status": guia.status
    }

@router.post("/usuarios/{usuario_id}/toggle-admin", response_model=Dict[str, Any])
def toggle_admin_status(
    usuario_id: int,
    current_admin: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Alternar o status de administrador de um usuário.
    Apenas usuários administradores podem acessar esta rota.
    """
    # Verificar se o usuário atual é o super admin
    if not current_admin.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas super administradores podem alterar o status de administrador"
        )
    
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Não permitir alterar o status do próprio usuário
    if usuario.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível alterar o próprio status de administrador"
        )
    
    # Alternar status
    usuario.is_admin = not usuario.is_admin
    
    db.commit()
    
    return {
        "message": f"Status de administrador alterado com sucesso para {'ativado' if usuario.is_admin else 'desativado'}",
        "usuario_id": usuario.id,
        "is_admin": usuario.is_admin
    }
