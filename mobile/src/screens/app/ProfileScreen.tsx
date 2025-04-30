import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Divider, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen: React.FC = () => {
  const { user, updateUser, signOut } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [cpf, setCpf] = useState(user?.cpf || '');
  const [nitPis, setNitPis] = useState(user?.nit_pis || '');
  const [category, setCategory] = useState(user?.category || 'INDIVIDUAL');
  
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Função para atualizar o perfil
  const handleUpdateProfile = async () => {
    if (!name || !email || !cpf || !nitPis) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios');
      return;
    }
    
    try {
      setLoading(true);
      
      await updateUser({
        name,
        email,
        cpf,
        nit_pis: nitPis,
        category: category as 'INDIVIDUAL' | 'DOMESTICO' | 'FACULTATIVO',
      });
      
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
      setEditing(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para confirmar logout
  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair do aplicativo?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          onPress: signOut,
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={64} color="#0066CC" />
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Nome</Text>
              {editing ? (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  style={styles.input}
                  disabled={loading}
                />
              ) : (
                <Text style={styles.fieldValue}>{user?.name}</Text>
              )}
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>E-mail</Text>
              {editing ? (
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="email-address"
                  disabled={loading}
                />
              ) : (
                <Text style={styles.fieldValue}>{user?.email}</Text>
              )}
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>CPF</Text>
              {editing ? (
                <TextInput
                  value={cpf}
                  onChangeText={(text) => {
                    // Aplicar máscara manualmente
                    const cleaned = text.replace(/\D/g, '');
                    let formatted = cleaned;
                    
                    if (cleaned.length <= 3) {
                      formatted = cleaned;
                    } else if (cleaned.length <= 6) {
                      formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
                    } else if (cleaned.length <= 9) {
                      formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
                    } else {
                      formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
                    }
                    
                    setCpf(formatted);
                  }}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  disabled={loading || true} // CPF não pode ser alterado
                  maxLength={14} // 999.999.999-99 (14 caracteres)
                />
              ) : (
                <Text style={styles.fieldValue}>{user?.cpf}</Text>
              )}
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>NIT/PIS</Text>
              {editing ? (
                <TextInput
                  value={nitPis}
                  onChangeText={(text) => {
                    // Aplicar máscara manualmente
                    const cleaned = text.replace(/\D/g, '');
                    let formatted = cleaned;
                    
                    if (cleaned.length <= 3) {
                      formatted = cleaned;
                    } else if (cleaned.length <= 8) {
                      formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
                    } else if (cleaned.length <= 10) {
                      formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 8)}.${cleaned.slice(8)}`;
                    } else {
                      formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 8)}.${cleaned.slice(8, 10)}-${cleaned.slice(10, 11)}`;
                    }
                    
                    setNitPis(formatted);
                  }}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  disabled={loading}
                  maxLength={14} // 999.99999.99-9 (14 caracteres)
                />
              ) : (
                <Text style={styles.fieldValue}>{user?.nit_pis}</Text>
              )}
            </View>
            
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Categoria</Text>
              {editing ? (
                <View style={styles.categoryContainer}>
                  <Button
                    mode={category === 'INDIVIDUAL' ? 'contained' : 'outlined'}
                    onPress={() => setCategory('INDIVIDUAL')}
                    style={styles.categoryButton}
                    disabled={loading}
                  >
                    Individual
                  </Button>
                  <Button
                    mode={category === 'DOMESTICO' ? 'contained' : 'outlined'}
                    onPress={() => setCategory('DOMESTICO')}
                    style={styles.categoryButton}
                    disabled={loading}
                  >
                    Doméstico
                  </Button>
                  <Button
                    mode={category === 'FACULTATIVO' ? 'contained' : 'outlined'}
                    onPress={() => setCategory('FACULTATIVO')}
                    style={styles.categoryButton}
                    disabled={loading}
                  >
                    Facultativo
                  </Button>
                </View>
              ) : (
                <Text style={styles.fieldValue}>
                  {user?.category === 'INDIVIDUAL' ? 'Individual' : 
                   user?.category === 'DOMESTICO' ? 'Doméstico' : 'Facultativo'}
                </Text>
              )}
            </View>
          </View>
        </Card.Content>
        
        <Card.Actions style={styles.cardActions}>
          {editing ? (
            <>
              <Button 
                mode="outlined" 
                onPress={() => setEditing(false)}
                disabled={loading}
                style={styles.cancelButton}
              >
                Cancelar
              </Button>
              <Button 
                mode="contained" 
                onPress={handleUpdateProfile}
                disabled={loading}
                loading={loading}
                style={styles.saveButton}
              >
                Salvar
              </Button>
            </>
          ) : (
            <Button 
              mode="contained" 
              onPress={() => setEditing(true)}
              icon="pencil"
              style={styles.editButton}
            >
              Editar Perfil
            </Button>
          )}
        </Card.Actions>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <Button 
            mode="outlined" 
            onPress={handleLogout}
            icon="logout"
            style={styles.logoutButton}
          >
            Sair da Conta
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  editButton: {
    backgroundColor: '#0066CC',
  },
  saveButton: {
    backgroundColor: '#0066CC',
  },
  cancelButton: {
    marginRight: 8,
  },
  logoutButton: {
    marginTop: 8,
    borderColor: '#ff3b30',
    borderWidth: 1,
  },
});

export default ProfileScreen;
