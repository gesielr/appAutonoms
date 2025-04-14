import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, Card, Button, RadioButton, TextInput, Snackbar, ActivityIndicator, Divider, List, Menu, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency, formatCompetencia } from '../../utils/formatters';
import { Ionicons } from '@expo/vector-icons';

type Competencia = {
  competencia: string;
  status: string;
  vencimento: string;
};

type CodigoPagamento = {
  codigo: string;
  nome: string;
  descricao: string;
  aliquota: number;
};

type Categoria = {
  categoria: string;
  nome: string;
  descricao: string;
  codigos_pagamento: CodigoPagamento[];
};

const GuideRequestScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  
  // Estados para o formulário
  const [categoria, setCategoria] = useState<string>('CONTRIBUINTE_INDIVIDUAL');
  const [competencia, setCompetencia] = useState<string>('');
  const [salarioContribuicao, setSalarioContribuicao] = useState<string>('1412.00');
  const [codigoPagamento, setCodigoPagamento] = useState<string>('');
  
  // Estados para os dados da API
  const [competenciasDisponiveis, setCompetenciasDisponiveis] = useState<Competencia[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<Categoria[]>([]);
  const [codigosPagamentoDisponiveis, setCodigosPagamentoDisponiveis] = useState<CodigoPagamento[]>([]);
  
  // Estados para os menus dropdown
  const [competenciaMenuVisible, setCompetenciaMenuVisible] = useState(false);
  const [categoriaMenuVisible, setCategoriaMenuVisible] = useState(false);
  const [codigoPagamentoMenuVisible, setCodigoPagamentoMenuVisible] = useState(false);
  
  // Estados para feedback
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Buscar competências e categorias disponíveis
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        
        // Buscar competências disponíveis
        const competenciasResponse = await api.get('/guides/competencias');
        setCompetenciasDisponiveis(competenciasResponse.data.competencias);
        
        // Definir competência padrão (primeira da lista)
        if (competenciasResponse.data.competencias.length > 0) {
          setCompetencia(competenciasResponse.data.competencias[0].competencia);
        }
        
        // Buscar categorias disponíveis
        const categoriasResponse = await api.get('/guides/categorias');
        setCategoriasDisponiveis(categoriasResponse.data.categorias);
        
        // Definir categoria padrão e códigos de pagamento
        if (categoriasResponse.data.categorias.length > 0) {
          const categoriaDefault = categoriasResponse.data.categorias[0];
          setCategoria(categoriaDefault.categoria);
          setCodigosPagamentoDisponiveis(categoriaDefault.codigos_pagamento);
          
          // Definir código de pagamento padrão
          if (categoriaDefault.codigos_pagamento.length > 0) {
            setCodigoPagamento(categoriaDefault.codigos_pagamento[0].codigo);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Não foi possível carregar as opções disponíveis. Tente novamente.');
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Atualizar códigos de pagamento quando a categoria mudar
  useEffect(() => {
    const categoriaAtual = categoriasDisponiveis.find(cat => cat.categoria === categoria);
    if (categoriaAtual) {
      setCodigosPagamentoDisponiveis(categoriaAtual.codigos_pagamento);
      
      // Definir código de pagamento padrão para a categoria
      if (categoriaAtual.codigos_pagamento.length > 0) {
        setCodigoPagamento(categoriaAtual.codigos_pagamento[0].codigo);
      }
    }
  }, [categoria, categoriasDisponiveis]);

  // Função para calcular o valor da contribuição
  const calcularValorContribuicao = (): number => {
    const salario = parseFloat(salarioContribuicao.replace(/[^\d,.-]/g, '').replace(',', '.'));
    
    // Buscar alíquota do código de pagamento selecionado
    const codigoAtual = codigosPagamentoDisponiveis.find(cod => cod.codigo === codigoPagamento);
    const aliquota = codigoAtual ? codigoAtual.aliquota : 0.2; // Padrão: 20%
    
    return salario * aliquota;
  };

  // Função para solicitar geração de guia
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validar dados
      if (!competencia || !categoria || !codigoPagamento) {
        setError('Preencha todos os campos obrigatórios');
        setLoading(false);
        return;
      }
      
      const salario = parseFloat(salarioContribuicao.replace(/[^\d,.-]/g, '').replace(',', '.'));
      if (isNaN(salario) || salario <= 0) {
        setError('Informe um valor válido para o salário de contribuição');
        setLoading(false);
        return;
      }
      
      // Preparar dados para envio
      const guideData = {
        competencia,
        categoria,
        salario_contribuicao: salario,
        codigo_pagamento: codigoPagamento
      };
      
      // Enviar solicitação
      const response = await api.post('/guides/generate', guideData);
      
      // Exibir mensagem de sucesso
      setSnackbarMessage('Guia solicitada com sucesso! Aguarde o processamento.');
      setSnackbarVisible(true);
      
      // Aguardar 2 segundos e navegar para a tela de detalhes
      setTimeout(() => {
        navigation.navigate('GuideDetails', { guideId: response.data.id });
      }, 2000);
      
    } catch (err: any) {
      console.error('Erro ao solicitar guia:', err);
      
      // Exibir mensagem de erro
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Não foi possível solicitar a guia. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Renderizar carregamento inicial
  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Carregando opções disponíveis...</Text>
      </View>
    );
  }

  // Renderizar erro inicial
  if (error && loadingData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.errorButton}>
          Voltar
        </Button>
      </View>
    );
  }

  // Renderizar formulário
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.title}>Solicitar Nova Guia</Text>
              <Divider style={styles.divider} />
              
              {/* Seleção de Competência */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Competência:</Text>
                <Menu
                  visible={competenciaMenuVisible}
                  onDismiss={() => setCompetenciaMenuVisible(false)}
                  anchor={
                    <TouchableRipple onPress={() => setCompetenciaMenuVisible(true)}>
                      <View style={styles.dropdownButton}>
                        <Text style={styles.dropdownButtonText}>
                          {competencia ? formatCompetencia(competencia) : 'Selecione a competência'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                      </View>
                    </TouchableRipple>
                  }
                >
                  {competenciasDisponiveis.map((comp) => (
                    <Menu.Item
                      key={comp.competencia}
                      title={formatCompetencia(comp.competencia)}
                      onPress={() => {
                        setCompetencia(comp.competencia);
                        setCompetenciaMenuVisible(false);
                      }}
                    />
                  ))}
                </Menu>
              </View>
              
              {/* Seleção de Categoria */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Categoria:</Text>
                <Menu
                  visible={categoriaMenuVisible}
                  onDismiss={() => setCategoriaMenuVisible(false)}
                  anchor={
                    <TouchableRipple onPress={() => setCategoriaMenuVisible(true)}>
                      <View style={styles.dropdownButton}>
                        <Text style={styles.dropdownButtonText}>
                          {categoriasDisponiveis.find(cat => cat.categoria === categoria)?.nome || 'Selecione a categoria'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                      </View>
                    </TouchableRipple>
                  }
                >
                  {categoriasDisponiveis.map((cat) => (
                    <Menu.Item
                      key={cat.categoria}
                      title={cat.nome}
                      onPress={() => {
                        setCategoria(cat.categoria);
                        setCategoriaMenuVisible(false);
                      }}
                    />
                  ))}
                </Menu>
                
                {/* Descrição da categoria */}
                {categoria && (
                  <Text style={styles.helperText}>
                    {categoriasDisponiveis.find(cat => cat.categoria === categoria)?.descricao}
                  </Text>
                )}
              </View>
              
              {/* Seleção de Código de Pagamento */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Código de Pagamento:</Text>
                <Menu
                  visible={codigoPagamentoMenuVisible}
                  onDismiss={() => setCodigoPagamentoMenuVisible(false)}
                  anchor={
                    <TouchableRipple onPress={() => setCodigoPagamentoMenuVisible(true)}>
                      <View style={styles.dropdownButton}>
                        <Text style={styles.dropdownButtonText}>
                          {codigosPagamentoDisponiveis.find(cod => cod.codigo === codigoPagamento)?.nome || 'Selecione o código'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                      </View>
                    </TouchableRipple>
                  }
                >
                  {codigosPagamentoDisponiveis.map((cod) => (
                    <Menu.Item
                      key={cod.codigo}
                      title={cod.nome}
                      onPress={() => {
                        setCodigoPagamento(cod.codigo);
                        setCodigoPagamentoMenuVisible(false);
                      }}
                    />
                  ))}
                </Menu>
                
                {/* Descrição do código */}
                {codigoPagamento && (
                  <Text style={styles.helperText}>
                    {codigosPagamentoDisponiveis.find(cod => cod.codigo === codigoPagamento)?.descricao}
                  </Text>
                )}
              </View>
              
              {/* Salário de Contribuição */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Salário de Contribuição:</Text>
                <TextInput
                  mode="outlined"
                  value={salarioContribuicao}
                  onChangeText={setSalarioContribuicao}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="Informe o valor"
                  left={<TextInput.Affix text="R$" />}
                />
                <Text style={styles.helperText}>
                  Valor sobre o qual será calculada a contribuição
                </Text>
              </View>
              
              {/* Resumo */}
              <Card style={styles.summaryCard}>
                <Card.Content>
                  <Text style={styles.summaryTitle}>Resumo da Contribuição</Text>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Competência:</Text>
                    <Text style={styles.summaryValue}>{competencia ? formatCompetencia(competencia) : '-'}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Categoria:</Text>
                    <Text style={styles.summaryValue}>
                      {categoriasDisponiveis.find(cat => cat.categoria === categoria)?.nome || '-'}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Código:</Text>
                    <Text style={styles.summaryValue}>
                      {codigosPagamentoDisponiveis.find(cod => cod.codigo === codigoPagamento)?.nome || '-'}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Salário:</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(parseFloat(salarioContribuicao.replace(/[^\d,.-]/g, '').replace(',', '.')))}
                    </Text>
                  </View>
                  <Divider style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabelBold}>Valor da Contribuição:</Text>
                    <Text style={styles.summaryValueBold}>
                      {formatCurrency(calcularValorContribuicao())}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabelBold}>Taxa de Serviço (10%):</Text>
                    <Text style={styles.summaryValueBold}>
                      {formatCurrency(calcularValorContribuicao() * 0.1)}
                    </Text>
                  </View>
                  <View style={styles.summaryTotal}>
                    <Text style={styles.summaryTotalLabel}>Total a Pagar:</Text>
                    <Text style={styles.summaryTotalValue}>
                      {formatCurrency(calcularValorContribuicao() * 1.1)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
              
              {/* Mensagem de erro */}
              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={20} color="red" />
                  <Text style={styles.errorBoxText}>{error}</Text>
                </View>
              )}
              
              {/* Botões */}
              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={() => navigation.goBack()}
                  style={styles.cancelButton}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.submitButton}
                  loading={loading}
                  disabled={loading}
                >
                  Solicitar Guia
                </Button>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Snackbar para feedback */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  divider: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  summaryCard: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
  },
  summaryLabelBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  summaryValueBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryDivider: {
    marginVertical: 8,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#0066CC',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 4,
    marginTop: 16,
  },
  errorBoxText: {
    color: 'red',
    marginLeft: 8,
    flex: 1,
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
  errorButton: {
    marginTop: 20,
  },
});

export default GuideRequestScreen;
