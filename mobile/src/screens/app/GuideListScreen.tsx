import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, ActivityIndicator, Chip, Button, Divider, FAB } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import api from '../../services/api';
import { formatCurrency, formatDate, formatCompetencia } from '../../utils/formatters';
import { Ionicons } from '@expo/vector-icons';

type Guide = {
  id: number;
  competencia: string;
  categoria: string;
  salario_contribuicao: number;
  valor_contribuicao: number;
  codigo_pagamento: string;
  status: GuideStatus;
  data_vencimento: string;
  data_pagamento_usuario?: string;
  data_pagamento_inss?: string;
  guia_url?: string;
  nota_fiscal_url?: string;
};

type GuideStatus = 
  | 'PROCESSANDO' 
  | 'GERADA' 
  | 'ERRO' 
  | 'PENDENTE_PAGAMENTO' 
  | 'PAGA_USUARIO' 
  | 'PAGA_INSS' 
  | 'CANCELADA';

const GuideListScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar as guias do usuário
  const fetchGuides = useCallback(async () => {
    try {
      setError(null);
      setRefreshing(true);
      
      const response = await api.get('/guides');
      setGuides(response.data);
    } catch (err) {
      console.error('Erro ao buscar guias:', err);
      setError('Não foi possível carregar suas guias. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Buscar guias quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      fetchGuides();
    }, [fetchGuides])
  );

  // Navegar para os detalhes da guia
  const handleGuidePress = (guideId: number) => {
    navigation.navigate('GuideDetails', { guideId });
  };

  // Navegar para a tela de solicitação de nova guia
  const handleNewGuide = () => {
    navigation.navigate('GuideRequest');
  };

  // Renderizar chip de status
  const renderStatusChip = (status: GuideStatus) => {
    let color = '';
    let label = '';
    let icon = '';
    
    switch (status) {
      case 'PROCESSANDO':
        color = 'blue';
        label = 'Processando';
        icon = 'reload-outline';
        break;
      case 'GERADA':
        color = 'green';
        label = 'Gerada';
        icon = 'checkmark-circle-outline';
        break;
      case 'ERRO':
        color = 'red';
        label = 'Erro';
        icon = 'alert-circle-outline';
        break;
      case 'PENDENTE_PAGAMENTO':
        color = 'orange';
        label = 'Aguardando Pagamento';
        icon = 'time-outline';
        break;
      case 'PAGA_USUARIO':
        color = 'purple';
        label = 'Paga (Processando INSS)';
        icon = 'hourglass-outline';
        break;
      case 'PAGA_INSS':
        color = 'teal';
        label = 'Paga ao INSS';
        icon = 'shield-checkmark-outline';
        break;
      case 'CANCELADA':
        color = 'grey';
        label = 'Cancelada';
        icon = 'close-circle-outline';
        break;
    }
    
    return (
      <Chip 
        icon={() => <Ionicons name={icon as any} size={16} color="white" />} 
        style={[styles.statusChip, { backgroundColor: color }]}
      >
        {label}
      </Chip>
    );
  };

  // Renderizar item da lista
  const renderGuideItem = ({ item }: { item: Guide }) => (
    <TouchableOpacity onPress={() => handleGuidePress(item.id)}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.competencia}>
                Competência: {formatCompetencia(item.competencia)}
              </Text>
              <Text style={styles.categoria}>
                {item.categoria === 'CONTRIBUINTE_INDIVIDUAL' 
                  ? 'Contribuinte Individual' 
                  : item.categoria === 'FACULTATIVO' 
                    ? 'Facultativo' 
                    : 'Empregador Doméstico'}
              </Text>
            </View>
            {renderStatusChip(item.status)}
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.valuesContainer}>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Salário de Contribuição:</Text>
              <Text style={styles.valueAmount}>{formatCurrency(item.salario_contribuicao)}</Text>
            </View>
            
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Valor da Contribuição:</Text>
              <Text style={styles.valueAmount}>{formatCurrency(item.valor_contribuicao)}</Text>
            </View>
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>
              <Ionicons name="calendar-outline" size={14} color="#666" /> Vencimento:
            </Text>
            <Text style={styles.infoValue}>{formatDate(item.data_vencimento)}</Text>
          </View>
          
          {item.status === 'PAGA_INSS' && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>
                <Ionicons name="checkmark-done-outline" size={14} color="#666" /> Paga em:
              </Text>
              <Text style={styles.infoValue}>{formatDate(item.data_pagamento_inss || '')}</Text>
            </View>
          )}
          
          {item.status === 'PENDENTE_PAGAMENTO' && (
            <Button 
              mode="contained" 
              icon="cash" 
              onPress={() => navigation.navigate('Payment', { guiaId: item.id })}
              style={styles.payButton}
            >
              Pagar Guia
            </Button>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  // Renderizar mensagem de lista vazia
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Você ainda não possui guias</Text>
      <Button 
        mode="contained" 
        icon="plus" 
        onPress={handleNewGuide}
        style={styles.newGuideButton}
      >
        Solicitar Nova Guia
      </Button>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Carregando suas guias...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchGuides} style={styles.retryButton}>
          Tentar novamente
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={guides}
        renderItem={renderGuideItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchGuides}
            colors={['#0066CC']}
          />
        }
      />
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleNewGuide}
        label="Nova Guia"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  competencia: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  categoria: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusChip: {
    height: 28,
  },
  divider: {
    marginVertical: 10,
  },
  valuesContainer: {
    marginVertical: 10,
  },
  valueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  valueLabel: {
    fontSize: 14,
    color: '#666',
  },
  valueAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 6,
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
  },
  payButton: {
    marginTop: 12,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  newGuideButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0066CC',
  },
});

export default GuideListScreen;
