from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import calendar

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import Usuario, Guia, TipoGuia, StatusGuia, CategoriaContribuinte
from app.schemas.guia import GuiaSchema, GuiaCreate, GuiaStatus, GuiaList, CompetenciasDisponiveis, CategoriasDisponiveis, CompetenciaInfo, CategoriaInfo, CategoriaContribuinte, CodigoPagamento
from app.tasks.guia_tasks import gerar_guia_task
from fastapi.responses import FileResponse
import os
from app.core.config import settings

router = APIRouter()

@router.post("/generate", response_model=GuiaStatus, status_code=status.HTTP_202_ACCEPTED)
def generate_guide(
    guide_data: GuiaCreate,
    background_tasks: BackgroundTasks,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Solicita a geração de uma nova guia.
    
    Args:
        guide_data: Dados para geração da guia
        background_tasks: Tarefas em segundo plano
        current_user: Usuário autenticado
        db: Sessão do banco de dados
        
    Returns:
        Status da guia criada
        
    Raises:
        HTTPException: Se ocorrer um erro ao criar a guia
    """
    # Determinar o tipo de guia com base na categoria
    tipo_guia = TipoGuia.GPS
    if guide_data.categoria == CategoriaContribuinte.DOMESTICO:
        tipo_guia = TipoGuia.DAE
    
    # Calcular valor total (valor da contribuição + 10% de taxa)
    valor_contribuicao = guide_data.salario_contribuicao
    if guide_data.codigo_pagamento in ['1007', '1406']:  # Códigos de 20%
        valor_contribuicao = guide_data.salario_contribuicao * 0.20
    elif guide_data.codigo_pagamento in ['1163', '1473']:  # Códigos de 11%
        valor_contribuicao = guide_data.salario_contribuicao * 0.11
    elif guide_data.codigo_pagamento in ['1120', '1465']:  # Códigos de 5%
        valor_contribuicao = guide_data.salario_contribuicao * 0.05
    
    # Adicionar 10% de taxa
    valor_total = valor_contribuicao * 1.10
    
    # Criar guia no banco de dados
    nova_guia = Guia(
        usuario_id=current_user.id,
        tipo=tipo_guia,
        competencia=guide_data.competencia,
        valor_contribuicao=valor_contribuicao,
        valor_total=valor_total,
        status=StatusGuia.GERADA,
        codigo_pagamento=guide_data.codigo_pagamento,
        salario_contribuicao=guide_data.salario_contribuicao
    )
    
    db.add(nova_guia)
    db.commit()
    db.refresh(nova_guia)
    
    # Enfileirar tarefa para gerar a guia em segundo plano
    background_tasks.add_task(
        gerar_guia_task,
        guia_id=nova_guia.id,
        usuario_id=current_user.id
    )
    
    return {"id": nova_guia.id, "status": nova_guia.status}

@router.get("/recent", response_model=List[GuiaSchema])
def get_recent_guides(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna as guias recentes do usuário.
    
    Args:
        current_user: Usuário autenticado
        db: Sessão do banco de dados
        
    Returns:
        Lista de guias do usuário
    """
    # Buscar guias do usuário, ordenadas pela data de geração (mais recentes primeiro)
    guias = db.query(Guia).filter(
        Guia.usuario_id == current_user.id
    ).order_by(Guia.data_geracao.desc()).limit(10).all()
    
    return guias

@router.get("/{guia_id}", response_model=GuiaSchema)
def get_guide_details(
    guia_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna os detalhes de uma guia específica.
    
    Args:
        guia_id: ID da guia
        current_user: Usuário autenticado
        db: Sessão do banco de dados
        
    Returns:
        Detalhes da guia
        
    Raises:
        HTTPException: Se a guia não for encontrada ou não pertencer ao usuário
    """
    # Buscar guia
    guia = db.query(Guia).filter(
        Guia.id == guia_id,
        Guia.usuario_id == current_user.id
    ).first()
    
    if not guia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guia não encontrada"
        )
    
    return guia

@router.get("/{guia_id}/status", response_model=GuiaStatus)
def get_guide_status(
    guia_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna o status atual de uma guia.
    
    Args:
        guia_id: ID da guia
        current_user: Usuário autenticado
        db: Sessão do banco de dados
        
    Returns:
        Status da guia
        
    Raises:
        HTTPException: Se a guia não for encontrada ou não pertencer ao usuário
    """
    # Buscar guia
    guia = db.query(Guia).filter(
        Guia.id == guia_id,
        Guia.usuario_id == current_user.id
    ).first()
    
    if not guia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guia não encontrada"
        )
    
    return {"id": guia.id, "status": guia.status}

@router.get("/{guia_id}/download", response_class=FileResponse)
def download_guide_pdf(
    guia_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    guia = db.query(Guia).filter(
        Guia.id == guia_id,
        Guia.usuario_id == current_user.id
    ).first()
    if not guia or not guia.pdf_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF da guia não encontrado"
        )
    filename = os.path.basename(guia.pdf_url)
    file_path = os.path.join(settings.PDF_STORAGE_PATH, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo PDF não encontrado no servidor"
        )
    return FileResponse(file_path, media_type="application/pdf", filename=filename)

@router.get("/competencias", response_model=CompetenciasDisponiveis)
def get_competencias_disponiveis(current_user: Usuario = Depends(get_current_user)):
    """
    Retorna as competências disponíveis para geração de guias.
    Por padrão, retorna a competência atual e as duas anteriores.
    """
    hoje = datetime.now()
    competencias = []
    
    # Competência atual
    ano_atual = hoje.year
    mes_atual = hoje.month
    
    # Adicionar competência atual
    ultimo_dia_mes = calendar.monthrange(ano_atual, mes_atual)[1]
    data_vencimento = datetime(ano_atual, mes_atual, 15)
    
    # Se já passou do dia 15, a data de vencimento é no próximo mês
    if hoje.day > 15:
        if mes_atual == 12:
            data_vencimento = datetime(ano_atual + 1, 1, 15)
        else:
            data_vencimento = datetime(ano_atual, mes_atual + 1, 15)
    
    competencia_atual = CompetenciaInfo(
        competencia=f"{ano_atual}-{mes_atual:02d}",
        status="ABERTA",
        vencimento=data_vencimento
    )
    competencias.append(competencia_atual)
    
    # Adicionar competência anterior (mês passado)
    if mes_atual == 1:
        mes_anterior = 12
        ano_anterior = ano_atual - 1
    else:
        mes_anterior = mes_atual - 1
        ano_anterior = ano_atual
    
    data_vencimento_anterior = datetime(ano_anterior, mes_anterior, 15)
    if data_vencimento_anterior < hoje:
        data_vencimento_anterior = datetime(ano_atual, mes_atual, 15)
    
    competencia_anterior = CompetenciaInfo(
        competencia=f"{ano_anterior}-{mes_anterior:02d}",
        status="ABERTA",
        vencimento=data_vencimento_anterior
    )
    competencias.append(competencia_anterior)
    
    # Adicionar competência anterior 2 (dois meses atrás)
    if mes_anterior == 1:
        mes_anterior2 = 12
        ano_anterior2 = ano_anterior - 1
    else:
        mes_anterior2 = mes_anterior - 1
        ano_anterior2 = ano_anterior
    
    data_vencimento_anterior2 = datetime(ano_anterior2, mes_anterior2, 15)
    if data_vencimento_anterior2 < hoje:
        data_vencimento_anterior2 = datetime(ano_atual, mes_atual, 15)
    
    competencia_anterior2 = CompetenciaInfo(
        competencia=f"{ano_anterior2}-{mes_anterior2:02d}",
        status="ABERTA",
        vencimento=data_vencimento_anterior2
    )
    competencias.append(competencia_anterior2)
    
    return {"competencias": competencias}

@router.get("/categorias", response_model=CategoriasDisponiveis)
def get_categorias_disponiveis(current_user: Usuario = Depends(get_current_user)):
    """
    Retorna as categorias e códigos de pagamento disponíveis para geração de guias.
    """
    categorias = []
    
    # Contribuinte Individual
    ci_codigos = [
        {
            "codigo": CodigoPagamento.CI_NORMAL,
            "nome": "Contribuinte Individual - 20%",
            "descricao": "Alíquota normal de 20% sobre o salário de contribuição",
            "aliquota": 0.2
        },
        {
            "codigo": CodigoPagamento.CI_LC_123,
            "nome": "Contribuinte Individual - 11%",
            "descricao": "Alíquota reduzida para MEI e empresas do Simples Nacional (LC 123)",
            "aliquota": 0.11
        },
        {
            "codigo": CodigoPagamento.CI_BAIXA_RENDA,
            "nome": "Contribuinte Individual - 5%",
            "descricao": "Alíquota reduzida para contribuinte de baixa renda",
            "aliquota": 0.05
        }
    ]
    
    categorias.append(
        CategoriaInfo(
            categoria=CategoriaContribuinte.CONTRIBUINTE_INDIVIDUAL,
            nome="Contribuinte Individual",
            descricao="Autônomos, profissionais liberais, empresários e prestadores de serviço",
            codigos_pagamento=ci_codigos
        )
    )
    
    # Facultativo
    fac_codigos = [
        {
            "codigo": CodigoPagamento.FAC_NORMAL,
            "nome": "Facultativo - 20%",
            "descricao": "Alíquota normal de 20% sobre o salário de contribuição",
            "aliquota": 0.2
        },
        {
            "codigo": CodigoPagamento.FAC_BAIXA_RENDA,
            "nome": "Facultativo - 5%",
            "descricao": "Alíquota reduzida para contribuinte de baixa renda",
            "aliquota": 0.05
        },
        {
            "codigo": CodigoPagamento.FAC_DONA_CASA,
            "nome": "Facultativo - Dona de Casa - 5%",
            "descricao": "Alíquota reduzida para dona de casa de baixa renda",
            "aliquota": 0.05
        }
    ]
    
    categorias.append(
        CategoriaInfo(
            categoria=CategoriaContribuinte.FACULTATIVO,
            nome="Facultativo",
            descricao="Estudantes, donas de casa e desempregados que desejam contribuir",
            codigos_pagamento=fac_codigos
        )
    )
    
    # Empregador Doméstico
    dom_codigos = [
        {
            "codigo": CodigoPagamento.DOM_NORMAL,
            "nome": "Empregador Doméstico",
            "descricao": "Contribuição para empregador doméstico",
            "aliquota": 0.2
        }
    ]
    
    categorias.append(
        CategoriaInfo(
            categoria=CategoriaContribuinte.EMPREGADOR_DOMESTICO,
            nome="Empregador Doméstico",
            descricao="Empregador de trabalhador doméstico",
            codigos_pagamento=dom_codigos
        )
    )
    
    return {"categorias": categorias}
