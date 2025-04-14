import logging
import os
import time
import uuid
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from webdriver_manager.chrome import ChromeDriverManager
from app.core.config import settings

# Configurar logger
logger = logging.getLogger(__name__)

# URL do SAL para contribuintes filiados após 29/11/1999
SAL_URL = "https://sal.rfb.gov.br/PortalSalInternet/faces/pages/calcContribuicoesCI/filiadosApos/selecionarOpcoesCalculoApos.xhtml"

def gerar_guia_sal(nome: str, cpf: str, nit_pis: str, competencia: str, salario_contribuicao: float, codigo_pagamento: str) -> str:
    """
    Automatiza a geração de guia GPS via SAL.
    
    Args:
        nome: Nome do contribuinte
        cpf: CPF do contribuinte
        nit_pis: NIT/PIS do contribuinte
        competencia: Competência no formato YYYY-MM
        salario_contribuicao: Valor do salário de contribuição
        codigo_pagamento: Código de pagamento da GPS
        
    Returns:
        URL do PDF da guia gerada
    """
    logger.info(f"Iniciando automação do SAL para {nome} (CPF: {cpf})")
    
    # Configurar o Chrome em modo headless
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # Se estiver em ambiente de produção e tiver certificado digital
    if settings.ENVIRONMENT == "production" and settings.CERTIFICATE_PATH:
        # Adicionar configurações para o certificado digital
        chrome_options.add_argument(f"--ssl-client-certificate={settings.CERTIFICATE_PATH}")
        # Outras configurações específicas para certificado digital podem ser necessárias
    
    try:
        # Inicializar o navegador
        driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        
        # Acessar o SAL
        driver.get(SAL_URL)
        logger.info("Acessando o portal SAL")
        
        # Aguardar carregamento da página
        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.ID, "formPrincipal"))
        )
        
        # Em um cenário real, aqui seria implementada a navegação completa no SAL:
        # 1. Selecionar categoria de segurado
        # 2. Preencher NIT/PIS
        # 3. Selecionar competência
        # 4. Informar salário de contribuição
        # 5. Selecionar código de pagamento
        # 6. Gerar a guia
        # 7. Baixar o PDF
        
        # Simulação da automação (em produção, substituir por código real)
        logger.info("Preenchendo formulário do SAL")
        time.sleep(2)  # Simular tempo de preenchimento
        
        # Exemplo de como seria a implementação real:
        """
        # Selecionar categoria de segurado
        categoria_select = Select(driver.find_element(By.ID, "formPrincipal:categoria"))
        if codigo_pagamento in ['1007', '1163', '1120']:
            categoria_select.select_by_value("CONTRIBUINTE_INDIVIDUAL")
        elif codigo_pagamento in ['1406', '1473', '1465']:
            categoria_select.select_by_value("FACULTATIVO")
            
        # Preencher NIT/PIS
        driver.find_element(By.ID, "formPrincipal:nit").send_keys(nit_pis)
        
        # Selecionar competência
        ano, mes = competencia.split('-')
        driver.find_element(By.ID, "formPrincipal:ano").send_keys(ano)
        mes_select = Select(driver.find_element(By.ID, "formPrincipal:mes"))
        mes_select.select_by_value(mes)
        
        # Informar salário de contribuição
        driver.find_element(By.ID, "formPrincipal:salario").send_keys(str(salario_contribuicao))
        
        # Selecionar código de pagamento
        codigo_select = Select(driver.find_element(By.ID, "formPrincipal:codigoPagamento"))
        codigo_select.select_by_value(codigo_pagamento)
        
        # Clicar no botão de calcular
        driver.find_element(By.ID, "formPrincipal:btnCalcular").click()
        
        # Aguardar resultado do cálculo
        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.ID, "formResultado"))
        )
        
        # Clicar no botão de gerar GPS
        driver.find_element(By.ID, "formResultado:btnGerarGPS").click()
        
        # Aguardar geração do PDF
        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.ID, "linkDownloadPDF"))
        )
        
        # Obter URL do PDF
        pdf_url = driver.find_element(By.ID, "linkDownloadPDF").get_attribute("href")
        """
        
        # Simular a geração do PDF (em produção, usar código acima)
        logger.info("Gerando PDF da guia")
        time.sleep(3)  # Simular tempo de geração do PDF
        
        # Simular URL do PDF gerado
        # Em produção, esta URL viria do SAL ou seria o caminho para o arquivo baixado
        pdf_filename = f"gps_{cpf}_{competencia.replace('-', '_')}_{uuid.uuid4().hex[:8]}.pdf"
        pdf_url = f"https://storage.example.com/guias/{pdf_filename}"
        
        logger.info(f"Guia gerada com sucesso: {pdf_url}")
        
        return pdf_url
        
    except Exception as e:
        logger.error(f"Erro na automação do SAL: {str(e)}")
        raise
        
    finally:
        # Fechar o navegador
        try:
            driver.quit()
        except:
            pass
