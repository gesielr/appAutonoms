import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Share, Alert, Linking } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Divider, Chip, Portal, Modal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

// Tipos para a rota e navegação
type AppStackParamList = {
  GuideDetails: { guideId: string };
  Payment: { guideId: string };
};

type GuideDetailsRouteProp = RouteProp<AppStackParamList, 'GuideDetails'>;
type GuideDetailsNavigationProp = NativeStackNavigationProp<AppStackParamList>;

// Tipo para a guia
type Guide = {
  id: string;
  tipo: 'GPS' | 'DAE';
  competencia: string;
  valor_contribuicao: number;
  valor_total: number; // Valor com a taxa de 10%
  status: 'GERADA' | 'PAGAMENTO_PENDENTE' | 'PAGA_USUARIO' | 'PAGA_INSS';
  data_geracao: string;
  data_pagamento_usuario?: string;
  data_pagamento_inss?: string;
  pdf_url: string;
  nota_fiscal_url?: string;
};

export default function GuideDetailsScreen() {
  const route = useRoute<GuideDetailsRouteProp>();
  const navigation = useNavigation<GuideDetailsNavigationProp>();
  const { guideId } = route.params;
  
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingNf, setDownloadingNf] = useState(false);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  
  // Função para buscar os detalhes da guia
  const fetchGuideDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/guides/${guideId}`);
      setGuide(response.data);
      setError('');
      
      // Se a guia estiver em processamento, configurar atualização automática
      if (response.data.status === 'GERADA') {
        setProcessingStatus('Gerando guia...');
        if (!refreshInterval) {
          const interval = setInterval(checkGuideStatus, 5000);
          setRefreshInterval(interval);
        }
      } else if (response.data.status === 'PAGA_USUARIO') {
        setProcessingStatus('Processando pagamento...');
        if (!refreshInterval) {
          const interval = setInterval(checkGuideStatus, 5000);
          setRefreshInterval(interval);
        }
      } else {
        // Se não estiver em processamento, limpar o intervalo
        if (refreshInterval) {
          clearInterval(refreshInterval);
          setRefreshInterval(null);
        }
      }
    } catch (err) {
      setError('Não foi possível carregar os detalhes da guia.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para verificar o status da guia (para atualizações automáticas)
  const checkGuideStatus = async () => {
    try {
      const response = await api.get(`/guides/${guideId}/status`);
      const newStatus = response.data.status;
      
      // Se o status mudou, atualizar a guia
      if (guide && newStatus !== guide.status) {
        fetchGuideDetails();
      }
      
      // Se o status não é mais de processamento, limpar o intervalo
      if (newStatus !== 'GERADA' && newStatus !== 'PAGA_USUARIO') {
        if (refreshInterval) {
          clearInterval(refreshInterval);
          setRefreshInterval(null);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar status da guia:', err);
    }
  };
  
  // Carregar detalhes ao montar o componente
  useEffect(() => {
    fetchGuideDetails();
    
    // Limpar intervalo ao desmontar
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [guideId]);
  
  // Função para baixar o PDF da guia
  const downloadPdf = async () => {
    if (!guide?.pdf_url) {
      Alert.alert('Erro', 'PDF da guia não disponível');
      return;
    }
    
    try {
      setDownloadingPdf(true);
      
      // Nome do arquivo local
      const fileName = `guia_${guide.tipo}_${guide.competencia.replace('-', '_')}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Baixar o arquivo
      const { uri } = await FileSystem.downloadAsync(
        guide.pdf_url,
        fileUri
      );
      
      // Verificar se o compartilhamento está disponível
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert(
          'Compartilhamento não disponível',
          'O compartilhamento não está disponível neste dispositivo'
        );
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível baixar o PDF da guia');
    } finally {
      setDownloadingPdf(false);
    }
  };
  
  // Função para baixar a nota fiscal
  const downloadNotaFiscal = async () => {
    if (!guide?.nota_fiscal_url) {
      Alert.alert('Erro', 'Nota fiscal não disponível');
      return;
    }
    
    try {
      setDownloadingNf(true);
      
      // Nome do arquivo local
      const fileName = `nf_${guide.competencia.replace('-', '_')}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Baixar o arquivo
      const { uri } = await FileSystem.downloadAsync(
        guide.nota_fiscal_url,
        fileUri
      );
      
      // Verificar se o compartilhamento está disponível
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert(
          'Compartilhamento não disponível',
          'O compartilhamento não está disponível neste dispositivo'
        );
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível baixar a nota fiscal');
    } finally {
      setDownloadingNf(false);
    }
  };
  
  // Função para ir para a tela de pagamento
  const goToPayment = () => {
    navigation.navigate('Payment', { guideId });
  };
  
  // Função para compartilhar detalhes da guia
  const shareGuideDetails = async () => {
    if (!guide) return;
    
    try {
      const message = `
        Guia ${guide.tipo} - Competência: ${formatCompetencia(guide.competencia)}
        Valor: ${formatCurrency(guide.valor_contribuicao)}
        Status: ${getStatusText(guide.status)}
        Gerada em: ${formatDate(guide.data_geracao)}
      `;
      
      await Share.share({
        message,
        title: `Guia ${guide.tipo} - ${formatCompetencia(guide.competencia)}`,
      });
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível compartilhar os detalhes da guia');
    }
  };
  
  // Função para mostrar o modal de processamento
  const showProcessingModal = () => {
    setModalVisible(true);
  };
  
  // Função para formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  // Função para formatar competência
  const formatCompetencia = (competencia: string) => {
    const [year, month] = competencia.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[parseInt(month) - 1]} de ${year}`;
  };
  
  // Função para formatar valor
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GERADA':
        return '#FFA000'; // Amarelo
      case 'PAGAMENTO_PENDENTE':
        return '#F44336'; // Vermelho
      case 'PAGA_USUARIO':
        return '#2196F3'; // Azul
      case 'PAGA_INSS':
        return '#4CAF50'; // Verde
      default:
        return '#757575'; // Cinza
    }
  };
  
  // Função para obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'GERADA':
        return 'Gerando';
      case 'PAGAMENTO_PENDENTE':
        return 'Aguardando Pagamento';
      case 'PAGA_USUARIO':
        return 'Paga (Processando)';
      case 'PAGA_INSS':
        return 'Finalizada';
      default:
        return status;
    }
  };
  
  // Função para obter descrição detalhada do status
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'GERADA':
        return 'Sua guia está sendo gerada. Este processo pode levar alguns instantes.';
      case 'PAGAMENTO_PENDENTE':
        return 'Sua guia foi gerada com sucesso e está aguardando pagamento.';
      case 'PAGA_USUARIO':
        return 'Recebemos seu pagamento. A guia está sendo paga ao INSS e em breve estará finalizada.';
      case 'PAGA_INSS':
        return 'Sua guia foi paga com sucesso ao INSS. O processo está concluído.';
      default:
        return '';
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Carregando detalhes da guia...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchGuideDetails}>
          Tentar Novamente
        </Button>
      </View>
    );
  }
  
  if (!guide) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-outline" size={48} color="#757575" />
        <Text style={styles.errorText}>Guia não encontrada</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Voltar
        </Button>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* Cabeçalho com status */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {guide.tipo} - {formatCompetencia(guide.competencia)}
            </Text>
            <Text style={styles.headerSubtitle}>
              Gerada em {formatDate(guide.data_geracao)}
            </Text>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(guide.status) }]}
            textStyle={styles.statusChipText}
          >
            {getStatusText(guide.status)}
          </Chip>
        </View>
        
        {/* Descrição do status atual */}
        <Card style={styles.statusCard}>
          <Card.Content>
            <Text style={styles.statusDescription}>
              {getStatusDescription(guide.status)}
            </Text>
            
            {(guide.status === 'GERADA' || guide.status === 'PAGA_USUARIO') && (
              <Button
                mode="text"
                onPress={showProcessingModal}
                style={styles.processingButton}
              >
                Ver detalhes do processamento
              </Button>
            )}
          </Card.Content>
        </Card>
        
        {/* Detalhes da guia */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Detalhes da Guia</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tipo:</Text>
              <Text style={styles.detailValue}>{guide.tipo}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Competência:</Text>
              <Text style={styles.detailValue}>{formatCompetencia(guide.competencia)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Valor da Contribuição:</Text>
              <Text style={styles.detailValue}>{formatCurrency(guide.valor_contribuicao)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Taxa de Serviço (10%):</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(guide.valor_total - guide.valor_contribuicao)}
              </Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Valor Total:</Text>
              <Text style={[styles.detailValue, styles.totalValue]}>
                {formatCurrency(guide.valor_total)}
              </Text>
            </View>
            
            {guide.data_pagamento_usuario && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Data do Pagamento:</Text>
                <Text style={styles.detailValue}>{formatDate(guide.data_pagamento_usuario)}</Text>
              </View>
            )}
            
            {guide.data_pagamento_inss && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Data de Pagamento ao INSS:</Text>
                <Text style={styles.detailValue}>{formatDate(guide.data_pagamento_inss)}</Text>
              </View>
            )}
          </Card.Content>
          
          <Card.Actions style={styles.cardActions}>
            {guide.status === 'PAGAMENTO_PENDENTE' && (
              <Button
                mode="contained"
                style={styles.payButton}
                onPress={goToPayment}
              >
                Pagar Guia
              </Button>
            )}
            
            {guide.pdf_url && (
              <Button
                mode="outlined"
                loading={downloadingPdf}
                disabled={downloadingPdf}
                onPress={downloadPdf}
                style={styles.downloadButton}
              >
                {downloadingPdf ? 'Baixando...' : 'Baixar PDF'}
              </Button>
            )}
          </Card.Actions>
        </Card>
        
        {/* Nota Fiscal (quando disponível) */}
        {guide.status === 'PAGA_INSS' && guide.nota_fiscal_url && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Nota Fiscal</Text>
              <Text style={styles.nfText}>
                A nota fiscal referente à taxa de serviço está disponível para download.
              </Text>
            </Card.Content>
            
            <Card.Actions>
              <Button
                mode="outlined"
                loading={downloadingNf}
                disabled={downloadingNf}
                onPress={downloadNotaFiscal}
                style={styles.downloadButton}
              >
                {downloadingNf ? 'Baixando...' : 'Baixar Nota Fiscal'}
              </Button>
            </Card.Actions>
          </Card>
        )}
        
        {/* Botões adicionais */}
        <View style={styles.additionalButtons}>
          <Button
            mode="text"
            icon="share-variant"
            onPress={shareGuideDetails}
          >
            Compartilhar
          </Button>
          
          <Button
            mode="text"
            icon="help-circle-outline"
            onPress={() => Linking.openURL('https://www.gov.br/inss/pt-br')}
          >
            Ajuda
          </Button>
        </View>
      </ScrollView>
      
      {/* Modal de processamento */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Processamento da Guia</Text>
          
          <View style={styles.processingSteps}>
            <View style={styles.processingStep}>
              <View style={[
                styles.stepIndicator,
                { backgroundColor: guide.status !== 'GERADA' ? '#4CAF50' : '#FFA000' }
              ]}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Geração da Guia</Text>
                <Text style={styles.stepDescription}>
                  {guide.status === 'GERADA' 
                    ? 'Acessando o sistema do INSS para gerar sua guia...' 
                    : 'Guia gerada com sucesso!'}
                </Text>
              </View>
            </View>
            
            <View style={[styles.stepConnector, { 
              backgroundColor: guide.status !== 'GERADA' ? '#4CAF50' : '#E0E0E0' 
            }]} />
            
            <View style={styles.processingStep}>
              <View style={[
                styles.stepIndicator,
                { backgroundColor: guide.status === 'PAGAMENTO_PENDENTE' ? '#F44336' : 
                  (guide.status === 'PAGA_USUARIO' || guide.status === 'PAGA_INSS') ? '#4CAF50' : '#E0E0E0' }
              ]}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Pagamento</Text>
                <Text style={styles.stepDescription}>
                  {guide.status === 'PAGAMENTO_PENDENTE' 
                    ? 'Aguardando seu pagamento via Pix' 
                    : (guide.status === 'PAGA_USUARIO' || guide.status === 'PAGA_INSS')
                      ? 'Pagamento recebido com sucesso!' 
                      : 'Aguardando geração da guia...'}
                </Text>
              </View>
            </View>
            
            <View style={[styles.stepConnector, { 
              backgroundColor: (guide.status === 'PAGA_USUARIO' || guide.status === 'PAGA_INSS') ? '#4CAF50' : '#E0E0E0' 
            }]} />
            
            <View style={styles.processingStep}>
              <View style={[
                styles.stepIndicator,
                { backgroundColor: guide.status === 'PAGA_USUARIO' ? '#2196F3' : 
                  guide.status === 'PAGA_INSS' ? '#4CAF50' : '#E0E0E0' }
              ]}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Pagamento ao INSS</Text>
                <Text style={styles.stepDescription}>
                  {guide.status === 'PAGA_USUARIO' 
                    ? 'Processando pagamento ao INSS...' 
                    : guide.status === 'PAGA_INSS'
                      ? 'Guia paga ao INSS com sucesso!' 
                      : 'Aguardando seu pagamento...'}
                </Text>
              </View>
            </View>
            
            <View style={[styles.stepConnector, { 
              backgroundColor: guide.status === 'PAGA_INSS' ? '#4CAF50' : '#E0E0E0' 
            }]} />
            
            <View style={styles.processingStep}>
              <View style={[
                styles.stepIndicator,
                { backgroundColor: guide.status === 'PAGA_INSS' ? '#4CAF50' : '#E0E0E0' }
              ]}>
                <Text style={styles.stepNumber}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Emissão de Nota Fiscal</Text>
                <Text style={styles.stepDescription}>
                  {guide.status === 'PAGA_INSS' 
                    ? 'Nota fiscal emitida com sucesso!' 
                    : 'Aguardando pagamento ao INSS...'}
                </Text>
              </View>
            </View>
          </View>
          
          <Button mode="contained" onPress={() => setModalVisible(false)}>
            Fechar
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusChip: {
    height: 32,
  },
  statusChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusCard: {
    marginBottom: 16,
    backgroundColor: '#FFFDE7',
  },
  statusDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  processingButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  divider: {
    marginVertical: 12,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  payButton: {
    backgroundColor: '#0066CC',
  },
  downloadButton: {
    marginLeft: 8,
  },
  nfText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  additionalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  processingSteps: {
    marginBottom: 24,
  },
  processingStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    color: 'white',
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginLeft: 16,
    marginBottom: 16,
  },
});
