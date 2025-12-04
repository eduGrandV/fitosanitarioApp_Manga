import {  useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Registro } from "../../data/daodaAvaliacao";
import { SafeAreaView } from "react-native-safe-area-context";
import { SincronizarBanco } from "../../services/api";

export default function UpdateScreen() {
  const [loading, setLoading] = useState(false);

  const onPressOut = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Verifica conexão
      const state = await NetInfo.fetch();
      if (!state.isConnected || state.type !== 'wifi') {
        Alert.alert('⚠️ Conexão', 'A sincronização só é permitida via Wi-Fi.');
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

      if (todasAvaliacoes.length === 0) {
        Alert.alert('⚠️', 'Não há avaliações para sincronizar.');
        return;
      }

      const sucesso = await SincronizarBanco(todasAvaliacoes);

      if (sucesso) {
        for (const chave of keysAvaliacoes) {
          await AsyncStorage.removeItem(chave);
        }
        Alert.alert('✅ Sucesso', 'Todos os lotes foram sincronizados com o servidor!');
      }

    } catch (error: any) {
      console.error("--- ERRO DE CONEXÃO DE REDE ---");
      console.error(error);
      Alert.alert("❌ Falha", `Não foi possível enviar os dados: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bgContainer}>
        <View style={styles.bgTop} />
        <View style={styles.bgBottom} />
      </View>

      <Text style={styles.header}>🔄 Sincronização</Text>

      <View style={styles.warningCard}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningTitle}>Atenção</Text>
        <Text style={styles.warningText}>
          Este botão sincroniza com o banco de dados remoto. Aperte somente quando estiver conectado ao{" "}
          <Text style={{ fontWeight: "bold", color: "#007BFF" }}>Wi-Fi</Text>.
        </Text>
      </View>

      <Pressable
        onPressOut={onPressOut}
        style={[styles.button, loading && { opacity: 0.6 }]}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "⏳ Sincronizando..." : "🚀 Sincronizar Agora"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F0F4FF", padding: 20 },
  bgContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgTop: { flex: 1, backgroundColor: "#C2D3FF" },
  bgBottom: { flex: 1, backgroundColor: "#F0F4FF" },
  header: { fontSize: 28, fontWeight: "800", marginBottom: 30, color: "#2E3A59", textAlign: "center" },
  warningCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginBottom: 40,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  warningIcon: { fontSize: 40, marginBottom: 5 },
  warningTitle: { fontWeight: "800", fontSize: 22, color: "#E63946", marginBottom: 10 },
  warningText: { fontSize: 16, color: "#555", textAlign: "center", lineHeight: 22 },
  button: {
    width: 300,
    paddingVertical: 18,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3A7DFF",
    shadowColor: "#2575fc",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 18, textTransform: "uppercase" },
});
