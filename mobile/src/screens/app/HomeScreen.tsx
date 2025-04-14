import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Tipo para as guias
type Guide = {
  id: string;
  tipo: 'GPS' | 'DAE';
  competencia: string;
  valor_contribuicao: number;
  status: 'GERADA' | 'PAGAMENTO_PENDENTE' | 'PAGA_USUARIO' | 'PAGA_INSS';
  data_geracao: string;
};

// Tipo para navegação
type AppStackParamList = {
  GuideDetails: { guideId: string };
  GuideRequest: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<AppStackParamList>;

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentGuides, setRecentGuides] = useState<Guide[]>([]);
  const [pendingGuides, setPendingGuides] = useState<Guide[]>([]);
  const [error, setError] = useState('');
  
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();

  // Função para buscar as guias recentes
  const fetchGuides = async () => {
    try {
      setLoading(true);
      const response = await api.get('/guides/recent');
      
      // Separar guias pendentes e recentes
      const guides = response.data;
      const pending = guides.filter((guide: Guide) => 
        guide.status === 'PAGAMENTO_PENDENTE'
      );
      const recent = guides.filter((guide: Guide) => 
        guide.status !== 'PAGAMENTO_PENDENTE'
      ).slice(0, 3); // Apenas as 3 mais recentes
      
      setPendingGuides(pending);
      setRecentGuides(recent);
      setError('');
    } catch (err) {
      setError('Não foi possível carregar as guias. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar guias ao montar o componente
  useEffect(() => {
    fetchGuides();
  }, []);

  // Função para atualizar ao puxar para baixo
  const onRefresh = () => {
    setRefreshing(true);
    fetchGuides();
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
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
        return 'Gerada';
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Olá, {user?.name.split(' ')[0]}</Text>
          <Text style={styles.welcomeSubtext}>
            Bem-vindo ao seu aplicativo de geração de guias do INSS
          </Text>
        </View>

        {/* Seção de guias pendentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guias Pendentes</Text>
          
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#0066CC" style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : pendingGuides.length === 0 ? (
            <Text style={styles.emptyText}>Você não possui guias pendentes.</Text>
          ) : (
            pendingGuides.map((guide) => (
              <Card
                key={guide.id}
                style={styles.card}
                onPress={() => navigation.navigate('GuideDetails', { guideId: guide.id })}
              >
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>
                      {guide.tipo} - {formatCompetencia(guide.competencia)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(guide.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(guide.status)}</Text>
                    </View>
                  </View>
                  <Divider style={styles.divider} />
                  <View style={styles.cardDetails}>
                    <Text>Valor: {formatCurrency(guide.valor_contribuicao)}</Text>
                    <Text>Gerada em: {formatDate(guide.data_geracao)}</Text>
                  </View>
                </Card.Content>
                <Card.Actions>
                  <Button 
                    mode="contained" 
                    onPress={() => navigation.navigate('GuideDetails', { guideId: guide.id })}
                  >
                    Ver Detalhes
                  </Button>
                </Card.Actions>
              </Card>
            ))
          )}
        </View>

        {/* Seção de guias recentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guias Recentes</Text>
          
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#0066CC" style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : recentGuides.length === 0 ? (
            <Text style={styles.emptyText}>Você ainda não possui guias geradas.</Text>
          ) : (
            recentGuides.map((guide) => (
              <Card
                key={guide.id}
                style={styles.card}
                onPress={() => navigation.navigate('GuideDetails', { guideId: guide.id })}
              >
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>
                      {guide.tipo} - {formatCompetencia(guide.competencia)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(guide.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(guide.status)}</Text>
                    </View>
                  </View>
                  <Divider style={styles.divider} />
                  <View style={styles.cardDetails}>
                    <Text>Valor: {formatCurrency(guide.valor_contribuicao)}</Text>
                    <Text>Gerada em: {formatDate(guide.data_geracao)}</Text>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>

        {/* Botão para gerar nova guia */}
        <Button
          mode="contained"
          style={styles.newGuideButton}
          icon="plus"
          onPress={() => navigation.navigate('GuideRequest')}
        >
          Gerar Nova Guia
        </Button>
      </ScrollView>
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
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 8,
  },
  cardDetails: {
    marginTop: 8,
  },
  loader: {
    marginVertical: 20,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
  },
  newGuideButton: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#0066CC',
  },
});
