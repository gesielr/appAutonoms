import pytest
from unittest.mock import patch, MagicMock
from app.services.pix_service import gerar_qrcode_pix, consultar_status_pix
from app.services.nfse_service import emitir_nfse

class TestPixService:
    """Testes para o serviço de pagamento Pix"""
    
    def test_gerar_qrcode_pix(self):
        """Testa a geração de QR code Pix"""
        # Arrange
        txid = "123e4567-e89b-12d3-a456-426655440000"
        valor = 100.50
        descricao = "Teste de geração de QR code"
        
        # Act
        qrcode_url, qrcode_text = gerar_qrcode_pix(txid, valor, descricao)
        
        # Assert
        assert isinstance(qrcode_url, str)
        assert isinstance(qrcode_text, str)
        assert "https://" in qrcode_url
        assert ".png" in qrcode_url
        assert len(qrcode_text) > 20
    
    def test_consultar_status_pix(self):
        """Testa a consulta de status de pagamento Pix"""
        # Arrange
        txid = "123e4567-e89b-12d3-a456-426655440000"
        
        # Act
        status = consultar_status_pix(txid)
        
        # Assert
        assert status in ["PENDING", "PAID", "EXPIRED", "CANCELLED"]

class TestNFSeService:
    """Testes para o serviço de emissão de notas fiscais"""
    
    def test_emitir_nfse(self):
        """Testa a emissão de nota fiscal de serviço"""
        # Arrange
        tomador_nome = "Cliente Teste"
        tomador_cpf = "12345678900"
        tomador_email = "cliente@example.com"
        valor = 100.50
        descricao = "Serviço de geração de guia INSS"
        
        # Act
        nfse_url = emitir_nfse(tomador_nome, tomador_cpf, tomador_email, valor, descricao)
        
        # Assert
        assert isinstance(nfse_url, str)
        assert "https://" in nfse_url
        assert ".pdf" in nfse_url

@patch('app.automation.sal_automation.webdriver')
class TestSalAutomation:
    """Testes para a automação do SAL"""
    
    def test_gerar_guia_sal(self, mock_webdriver, monkeypatch):
        """Testa a geração de guia via SAL"""
        # Importar aqui para evitar problemas com o patch
        from app.automation.sal_automation import gerar_guia_sal
        
        # Arrange
        # Configurar mocks
        mock_driver = MagicMock()
        mock_webdriver.Chrome.return_value = mock_driver
        
        # Simular comportamento do driver
        mock_driver.get.return_value = None
        
        # Parâmetros de teste
        nome = "Contribuinte Teste"
        cpf = "12345678900"
        nit_pis = "12345678900"
        competencia = "2025-04"
        salario_contribuicao = 1500.00
        codigo_pagamento = "1007"
        
        # Act
        pdf_url = gerar_guia_sal(nome, cpf, nit_pis, competencia, salario_contribuicao, codigo_pagamento)
        
        # Assert
        assert isinstance(pdf_url, str)
        assert "https://" in pdf_url
        assert ".pdf" in pdf_url
        mock_driver.get.assert_called_once()
        mock_driver.quit.assert_called_once()
