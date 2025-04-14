import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Image, ScrollView, Share, Alert, Linking } from 'react-native';
import { Text, Button, Card, ActivityIndicator, Divider, Chip } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppNavigator';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

type PaymentScreenProps = {
  route: {
    params: {
      guiaId: number;
    };
  };
};

type PaymentStatus = 'PENDENTE' | 'PAGO' | 'EXPIRADO' | 'CANCELADO';

type PaymentDetails = {
  id: number;
  guia_id: number;
  valor: number;
  status: PaymentStatus;
  qrcode_url: string;
  qrcode_text: string;
  txid: string;
  created_at: string;
  expires_at: string;
  paid_at: string | null;
};

const PaymentScreen: React.FC<PaymentScreenProps> = ({ route }) => {
  const { guiaId } = route.params;
  // Usando o useNavigation sem tipagem genérica
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Função para buscar os detalhes do pagamento
  const fetchPaymentDetails = useCallback(async () => {
    try {
      setError(null);
      setRefreshing(true);
      
      const response = await api.get(`/payments/${guiaId}`);
      setPayment(response.data);
      
      // Se o pagamento estiver pendente, configurar verificação periódica
      if (response.data.status === 'PENDENTE') {
        setupStatusCheck();
      } else if (response.data.status === 'PAGO') {
        clearStatusCheck();
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes do pagamento:', err);
      setError('Não foi possível carregar os detalhes do pagamento. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [guiaId]);

  // Configurar verificação periódica do status do pagamento
  const setupStatusCheck = useCallback(() => {
    // Limpar intervalo existente, se houver
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    
    // Verificar status a cada 10 segundos
    const interval = setInterval(() => {
      fetchPaymentDetails();
    }, 10000);
    
    setStatusCheckInterval(interval);
    
    return interval;
  }, [fetchPaymentDetails, statusCheckInterval]);

  // Limpar verificação periódica
  const clearStatusCheck = useCallback(() => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
  }, [statusCheckInterval]);

  // Copiar código Pix para a área de transferência
  const copyPixCode = async () => {
    if (payment?.qrcode_text) {
      await Clipboard.setStringAsync(payment.qrcode_text);
      Alert.alert('Código Pix copiado', 'O código Pix foi copiado para a área de transferência.');
    }
  };

  // Compartilhar código Pix
  const sharePixCode = async () => {
    if (payment?.qrcode_text) {
      try {
        await Share.share({
          message: `Código Pix para pagamento da guia INSS: ${payment.qrcode_text}`,
        });
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível compartilhar o código Pix.');
      }
    }
  };

  // Abrir aplicativo de banco (simulação)
  const openBankApp = () => {
    Alert.alert(
      'Abrir aplicativo do banco',
      'Escolha seu banco para pagar com Pix',
      [
        { text: 'Banco do Brasil', onPress: () => Linking.openURL('https://www.bb.com.br') },
        { text: 'Itaú', onPress: () => Linking.openURL('https://www.itau.com.br') },
        { text: 'Nubank', onPress: () => Linking.openURL('https://nubank.com.br') },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  // Voltar para a tela inicial
  const goToHome = () => {
    navigation.navigate('Home');
  };

  // Verificar status do pagamento ao focar na tela
  useFocusEffect(
    useCallback(() => {
      fetchPaymentDetails();
      
      // Limpar intervalo ao sair da tela
      return () => {
        clearStatusCheck();
      };
    }, [fetchPaymentDetails, clearStatusCheck])
  );

  // Renderizar chip de status
  const renderStatusChip = () => {
    if (!payment) return null;
    
    let color = '';
    let icon = '';
    
    switch (payment.status) {
      case 'PENDENTE':
        color = 'orange';
        icon = 'time-outline';
        break;
      case 'PAGO':
        color = 'green';
        icon = 'checkmark-circle-outline';
        break;
      case 'EXPIRADO':
        color = 'red';
        icon = 'close-circle-outline';
        break;
      case 'CANCELADO':
        color = 'grey';
        icon = 'close-outline';
        break;
    }
    
    return (
      <Chip icon={() => <Ionicons name={icon as any} size={16} color="white" />} style={[styles.statusChip, { backgroundColor: color }]}>
        {payment.status}
      </Chip>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Carregando detalhes do pagamento...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchPaymentDetails} style={styles.retryButton}>
          Tentar novamente
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Pagamento da Guia</Text>
            {renderStatusChip()}
          </View>
          
          <Divider style={styles.divider} />
          
          {payment?.status === 'PAGO' ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={80} color="green" />
              <Text style={styles.successTitle}>Pagamento Confirmado!</Text>
              <Text style={styles.successText}>
                Seu pagamento foi processado com sucesso. A guia será paga automaticamente ao INSS.
              </Text>
              <Button 
                mode="contained" 
                onPress={goToHome} 
                style={styles.homeButton}
              >
                Voltar para o início
              </Button>
            </View>
          ) : payment?.status === 'PENDENTE' ? (
            <>
              <View style={styles.valueContainer}>
                <Text style={styles.valueLabel}>Valor a pagar:</Text>
                <Text style={styles.valueAmount}>{formatCurrency(payment?.valor || 0)}</Text>
              </View>
              
              <Text style={styles.instructions}>
                Escaneie o QR Code abaixo com o aplicativo do seu banco ou copie o código Pix para realizar o pagamento.
              </Text>
              
              <View style={styles.qrcodeContainer}>
                {payment?.qrcode_url ? (
                  <Image 
                    source={{ uri: payment.qrcode_url }} 
                    style={styles.qrcode} 
                    resizeMode="contain"
                  />
                ) : (
                  <ActivityIndicator size="large" color="#0066CC" />
                )}
              </View>
              
              <View style={styles.actionsContainer}>
                <Button 
                  mode="contained" 
                  icon="content-copy" 
                  onPress={copyPixCode} 
                  style={styles.actionButton}
                >
                  Copiar código
                </Button>
                <Button 
                  mode="contained" 
                  icon="share-variant" 
                  onPress={sharePixCode} 
                  style={styles.actionButton}
                >
                  Compartilhar
                </Button>
              </View>
              
              <Button 
                mode="contained" 
                icon="bank" 
                onPress={openBankApp} 
                style={styles.bankButton}
              >
                Abrir app do banco
              </Button>
              
              <View style={styles.infoContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
                <Text style={styles.infoText}>
                  O status do pagamento é atualizado automaticamente. Após a confirmação, 
                  a guia será paga ao INSS e você receberá uma notificação.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.expiredContainer}>
              <Ionicons name="close-circle" size={80} color="red" />
              <Text style={styles.expiredTitle}>Pagamento {payment?.status}</Text>
              <Text style={styles.expiredText}>
                Este pagamento não pode ser processado. Por favor, retorne à tela de detalhes da guia e tente novamente.
              </Text>
              <Button 
                mode="contained" 
                onPress={goToHome} 
                style={styles.homeButton}
              >
                Voltar para o início
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statusChip: {
    height: 30,
  },
  divider: {
    marginVertical: 15,
  },
  valueContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  valueLabel: {
    fontSize: 16,
    color: '#666',
  },
  valueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066CC',
    marginTop: 5,
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#444',
  },
  qrcodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrcode: {
    width: 200,
    height: 200,
    marginVertical: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  bankButton: {
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'green',
    marginTop: 15,
  },
  successText: {
    textAlign: 'center',
    marginVertical: 15,
    fontSize: 16,
  },
  homeButton: {
    marginTop: 20,
    paddingHorizontal: 30,
  },
  expiredContainer: {
    alignItems: 'center',
    padding: 20,
  },
  expiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'red',
    marginTop: 15,
  },
  expiredText: {
    textAlign: 'center',
    marginVertical: 15,
    fontSize: 16,
  },
});

export default PaymentScreen;
