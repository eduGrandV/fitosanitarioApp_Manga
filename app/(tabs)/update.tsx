import { useState, useEffect, useCallback } from "react";
import { Alert, Pressable, StyleSheet, Text, View, ActivityIndicator, StatusBar } from "react-native";
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

// Importe seus serviços e tipos
import { Registro } from "../../data/daodaAvaliacao";
import { SincronizarBanco } from "../../services/api";

export default function UpdateScreen() {
  const [loading, setLoading] = useState(false);
  const [qtdPendentes, setQtdPendentes] = useState(0);

  // Carrega a quantidade de registros pendentes ao abrir a tela
  const carregarPendencias = useCallback(async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysAvaliacoes = allKeys.filter(key => key.startsWith('@avaliacoes_'));
      
      let total = 0;
      for (const chave of keysAvaliacoes) {
        const item = await AsyncStorage.getItem(chave);
        if (item) {
          const dados = JSON.parse(item);
          total += Array.isArray(dados) ? dados.length : 1;
        }
      }
      setQtdPendentes(total);
    } catch (e) {
      console.log("Erro ao contar pendencias", e);
    }
  }, []);

  useEffect(() => {
    carregarPendencias();
  }, [carregarPendencias]);

  const handleSync = async () => {
    if (loading) return;
    
    if (qtdPendentes === 0) {
      Alert.alert("Tudo certo!", "Não há novos registros para sincronizar.");
      return;
    }

    setLoading(true);

    try {
      // 1. Verifica conexão Wi-Fi (Requisito de segurança/dados)
      const state = await NetInfo.fetch();
      if (!state.isConnected || state.type !== 'wifi') {
        Alert.alert(
          '⚠️ Conexão Exigida', 
          'Para economizar dados móveis, a sincronização só é permitida via Wi-Fi.'
        );
        return;
      }

      await sincronizarTodosLotes();

    } finally {
      setLoading(false);
    }
  };

  const sincronizarTodosLotes = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysAvaliacoes = allKeys.filter(key => key.startsWith('@avaliacoes_'));

      let todasAvaliacoes: Registro[] = [];
      for (const chave of keysAvaliacoes) {
        const jsonAvaliacoes = await AsyncStorage.getItem(chave);
        if (jsonAvaliacoes) {
          todasAvaliacoes = [...todasAvaliacoes, ...JSON.parse(jsonAvaliacoes)];
        }
      }

      const sucesso = await SincronizarBanco(todasAvaliacoes);

      if (sucesso) {
        // Limpa o banco local
        for (const chave of keysAvaliacoes) {
          await AsyncStorage.removeItem(chave);
        }
        // Atualiza o contador na tela
        setQtdPendentes(0);
        Alert.alert('✅ Sucesso', 'Todos os dados foram enviados para a nuvem!');
      }

    } catch (error: any) {
      console.error(error);
      Alert.alert("❌ Erro no Envio", `Falha ao conectar com o servidor.\n${error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.content}>
        
        {/* ÍCONE DE CABEÇALHO */}
        <View style={styles.iconContainer}>
          <Text style={{ fontSize: 40 }}>☁️</Text>
        </View>

        <Text style={styles.title}>Sincronização</Text>
        <Text style={styles.subtitle}>
          Envie os dados coletados offline para o sistema central.
        </Text>

        {/* CARD DE STATUS */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Registros Pendentes</Text>
          <Text style={[styles.statusValue, { color: qtdPendentes > 0 ? '#ef4444' : '#10b981' }]}>
            {qtdPendentes}
          </Text>
          <Text style={styles.statusHelper}>
            {qtdPendentes > 0 
              ? "Você possui dados não salvos na nuvem." 
              : "Seu dispositivo está atualizado."}
          </Text>
        </View>

        {/* CARD DE AVISO WI-FI */}
        <View style={styles.warningContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={{flex: 1}}>
            <Text style={styles.warningTitle}>Requer Wi-Fi</Text>
            <Text style={styles.warningText}>
              Para evitar consumo excessivo do seu plano de dados, conecte-se a uma rede Wi-Fi.
            </Text>
          </View>
        </View>

      </View>

      {/* BOTÃO DE AÇÃO NO RODAPÉ */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleSync}
          disabled={loading || qtdPendentes === 0}
          style={({ pressed }) => [
            styles.button,
            (loading || qtdPendentes === 0) && styles.buttonDisabled,
            pressed && styles.buttonPressed
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {qtdPendentes === 0 ? "Tudo Sincronizado" : "Sincronizar Agora"}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Slate-50 (fundo bem claro)
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Cabeçalho
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#eff6ff", // Azul bem claro
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#dbeafe"
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b", // Slate-800
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b", // Slate-500
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },

  // Card de Status (Contador)
  statusCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    // Sombra suave
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9"
  },
  statusLabel: {
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusHelper: {
    fontSize: 14,
    color: "#64748b",
  },

  // Aviso Wi-Fi
  warningContainer: {
    flexDirection: "row",
    backgroundColor: "#fffbeb", // Amber-50
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fcd34d", // Amber-300
    alignItems: "center",
    width: "100%",
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningTitle: {
    fontWeight: "bold",
    color: "#b45309", // Amber-700
    marginBottom: 2,
    fontSize: 15
  },
  warningText: {
    fontSize: 13,
    color: "#92400e", // Amber-800
    lineHeight: 18
  },

  // Rodapé e Botão
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    backgroundColor: "#2563EB", // Azul Royal moderno
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8", // Cinza desabilitado
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
});