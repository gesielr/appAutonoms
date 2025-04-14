import pytest
from fastapi import status
import json
from datetime import datetime, timedelta

class TestAuthRoutes:
    """Testes para as rotas de autenticação"""
    
    def test_login_success(self, client, test_user):
        """Testa login com credenciais válidas"""
        # Arrange
        login_data = {
            "cpf": "12345678900",
            "senha": "password"
        }
        
        # Act
        response = client.post("/auth/token", data=login_data)
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.json()
        assert response.json()["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client):
        """Testa login com credenciais inválidas"""
        # Arrange
        login_data = {
            "cpf": "12345678900",
            "senha": "senha_incorreta"
        }
        
        # Act
        response = client.post("/auth/token", data=login_data)
        
        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

class TestUserRoutes:
    """Testes para as rotas de usuários"""
    
    def test_create_user(self, client):
        """Testa criação de novo usuário"""
        # Arrange
        user_data = {
            "nome": "Novo Usuário",
            "email": "novo@example.com",
            "cpf": "98765432100",
            "nit_pis": "98765432100",
            "senha": "senha123"
        }
        
        # Act
        response = client.post("/users/", json=user_data)
        
        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["nome"] == user_data["nome"]
        assert response.json()["email"] == user_data["email"]
        assert response.json()["cpf"] == user_data["cpf"]
        assert "id" in response.json()
    
    def test_get_current_user(self, client, token):
        """Testa obtenção do usuário atual"""
        # Arrange
        headers = {"Authorization": f"Bearer {token}"}
        
        # Act
        response = client.get("/users/me", headers=headers)
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["cpf"] == "12345678900"

class TestGuideRoutes:
    """Testes para as rotas de guias"""
    
    def test_generate_guide(self, client, token, db_session):
        """Testa geração de nova guia"""
        # Arrange
        headers = {"Authorization": f"Bearer {token}"}
        guide_data = {
            "competencia": "2025-04",
            "categoria": "CONTRIBUINTE_INDIVIDUAL",
            "salario_contribuicao": 1500.00,
            "codigo_pagamento": "1007"
        }
        
        # Act
        response = client.post("/guides/generate", json=guide_data, headers=headers)
        
        # Assert
        assert response.status_code == status.HTTP_202_ACCEPTED
        assert "id" in response.json()
        assert response.json()["status"] == "PROCESSANDO"
    
    def test_get_user_guides(self, client, token, db_session, test_user):
        """Testa listagem de guias do usuário"""
        # Arrange
        headers = {"Authorization": f"Bearer {token}"}
        
        # Criar uma guia para o usuário
        from app.db.models import Guia
        guia = Guia(
            usuario_id=test_user.id,
            competencia="2025-04",
            categoria="CONTRIBUINTE_INDIVIDUAL",
            salario_contribuicao=1500.00,
            valor_contribuicao=165.00,
            codigo_pagamento="1007",
            status="GERADA",
            data_vencimento=datetime.now() + timedelta(days=10)
        )
        db_session.add(guia)
        db_session.commit()
        
        # Act
        response = client.get("/guides/", headers=headers)
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)
        assert len(response.json()) >= 1
        assert response.json()[0]["competencia"] == "2025-04"

class TestPaymentRoutes:
    """Testes para as rotas de pagamentos"""
    
    def test_get_payment_details(self, client, token, db_session, test_user):
        """Testa obtenção de detalhes de pagamento"""
        # Arrange
        headers = {"Authorization": f"Bearer {token}"}
        
        # Criar uma guia e um pagamento para o usuário
        from app.db.models import Guia, Pagamento, StatusPagamento
        guia = Guia(
            usuario_id=test_user.id,
            competencia="2025-04",
            categoria="CONTRIBUINTE_INDIVIDUAL",
            salario_contribuicao=1500.00,
            valor_contribuicao=165.00,
            codigo_pagamento="1007",
            status="GERADA",
            data_vencimento=datetime.now() + timedelta(days=10)
        )
        db_session.add(guia)
        db_session.commit()
        db_session.refresh(guia)
        
        pagamento = Pagamento(
            guia_id=guia.id,
            valor=181.50,  # Valor + 10% de taxa
            status=StatusPagamento.PENDENTE,
            qrcode_url="https://example.com/qrcode.png",
            qrcode_text="00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426655440000520400005303986540181.505802BR5913REBELO CONTAB6008BRASILIA62070503***63041D14",
            txid="123e4567-e89b-12d3-a456-426655440000",
            expires_at=datetime.now() + timedelta(hours=24)
        )
        db_session.add(pagamento)
        db_session.commit()
        
        # Act
        response = client.get(f"/payments/{guia.id}", headers=headers)
        
        # Assert
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["guia_id"] == guia.id
        assert response.json()["valor"] == 181.50
        assert response.json()["status"] == "PENDENTE"
        assert "qrcode_url" in response.json()
        assert "qrcode_text" in response.json()
