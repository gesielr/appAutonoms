import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

type Guide = {
  id: string;
  competencia: string;
  categoria: string;
  valor: number;
  status: 'PENDENTE' | 'PAGO' | 'PROCESSANDO' | 'CONCLUIDO' | 'CANCELADO';
  created_at: string;
  payment_id: string | null;
};

const GuideHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar o histórico de guias
  const fetchGuides = useCallback(async () => {
    try {
      setError(null);
      setRefreshing(true);
      
      const response = await api.get('/guides/history');
      setGuides(response.data);
    } catch (err) {
      console.error('Erro ao buscar histórico de guias:', err);
      setError('Não foi possível carregar o histórico de guias. Tente novamente.');
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
  const handleViewDetails = (guideId: string) => {
    navigation.navigate('GuideDetails', { guideId });
  };

  // Navegar para a tela de pagamento
  const handlePayment = (guideId: string) => {
    navigation.navigate('Payment', { guiaId: Number(guideId) });
  };

  // Renderizar chip de status
  const renderStatusChip = (status: Guide['status']) => {
    let color = '';
    let icon = '';
    
    switch (status) {
      case 'PENDENTE':
        color = 'orange';
        icon = 'time-outline';
        break;
      case 'PAGO':
        color = 'blue';
        icon = 'checkmark-circle-outline';
        break;
      case 'PROCESSANDO':
        color = 'purple';
        icon = 'refresh-outline';
        break;
      case 'CONCLUIDO':
        color = 'green';
        icon = 'checkmark-done-outline';
        break;
      case 'CANCELADO':
        color = 'grey';
        icon = 'close-outline';
        break;
    }
    
    return (
      <Chip icon={() => <Ionicons name={icon as any} size={16} color="white" />} style={[styles.statusChip, { backgroundColor: color }]}>
        {status}
      </Chip>
    );
  };

  // Renderizar item da lista
  const renderGuideItem = ({ item }: { item: Guide }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.competencia}>Competência: {item.competencia}</Text>
          {renderStatusChip(item.status)}
        </View>
        
        <Text style={styles.categoria}>Categoria: {item.categoria}</Text>
        <Text style={styles.valor}>Valor: {formatCurrency(item.valor)}</Text>
        <Text style={styles.data}>Data: {formatDate(item.created_at)}</Text>
      </Card.Content>
      
      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="text" 
          onPress={() => handleViewDetails(item.id)}
          icon="information-outline"
        >
          Detalhes
        </Button>
        
        {item.status === 'PENDENTE' && (
          <Button 
            mode="contained" 
            onPress={() => handlePayment(item.id)}
            icon="cash"
            style={styles.payButton}
          >
            Pagar
          </Button>
        )}
      </Card.Actions>
    </Card>
  );

  // Renderizar mensagem de lista vazia
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Nenhuma guia encontrada</Text>
      <Text style={styles.emptySubtext}>Solicite uma nova guia para visualizar aqui</Text>
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('GuideRequest')}
        style={styles.newGuideButton}
        icon="plus"
      >
        Nova Guia
      </Button>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Carregando histórico de guias...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="red" />
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
        keyExtractor={(item) => item.id}
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
    paddingBottom: 32,
    flexGrow: 1,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  competencia: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoria: {
    fontSize: 14,
    marginBottom: 4,
  },
  valor: {
    fontSize: 14,
    marginBottom: 4,
  },
  data: {
    fontSize: 14,
    color: '#666',
  },
  statusChip: {
    height: 28,
  },
  cardActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  payButton: {
    backgroundColor: '#0066CC',
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
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    minHeight: 300,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  newGuideButton: {
    marginTop: 16,
    backgroundColor: '#0066CC',
  },
});

export default GuideHistoryScreen;
