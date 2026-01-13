import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { locaPlanta, PontoLocalizacao, Registro } from "../data/daodaAvaliacao";

type Props = {
  lote: string;
  planta: number;
  setAvaliacoes: React.Dispatch<React.SetStateAction<Registro[]>>;
};

const CHAVE_BASE = '@avaliacoes';
const SENHA_ADMIN = '1234';


export const salvarAvaliacoes = async (
  novasAvaliacoes: Registro[],
  lote: string
) => {
  try {
    const chaveAvaliacoes = `${CHAVE_BASE}_${lote}`;

    const dadosAntigosJSON = await AsyncStorage.getItem(chaveAvaliacoes);
    const dadosAntigos: Registro[] = dadosAntigosJSON ? JSON.parse(dadosAntigosJSON) : [];

    const todosOsDados = [...dadosAntigos, ...novasAvaliacoes]

    await AsyncStorage.setItem(chaveAvaliacoes, JSON.stringify(todosOsDados));

    console.log("Dados combinados foram salvos com sucesso.");
    Alert.alert('✅ Sucesso!', `Dados do lote ${lote} foram salvos.`);
  } catch (e) {
    console.error("Erro ao salvar dados:", e);
    Alert.alert('❌ Erro', 'Ocorreu um erro ao salvar os dados.');
  }
};


export const carregarDadosCompletos = async (
  lote: string,
  setAvaliacoes: (avaliacoes: Registro[]) => void
) => {
  try {
    const chaveAvaliacoes = `${CHAVE_BASE}_${lote}`;
    const jsonAvaliacoes = await AsyncStorage.getItem(chaveAvaliacoes);
    const dadosAvaliacoes: Registro[] = jsonAvaliacoes ? JSON.parse(jsonAvaliacoes) : [];

    setAvaliacoes(dadosAvaliacoes);

    const plantasAgrupadas = Object.values(
      dadosAvaliacoes.reduce((acc: Record<string, any>, registro) => {
        if (!acc[registro.planta]) {
          acc[registro.planta] = { planta: registro.planta, avaliacoes: [] };
        }

        acc[registro.planta].avaliacoes.push({
          doencaOuPraga: registro.doencaOuPraga,
          orgao: registro.orgao,
          quadrante: registro.quadrante,
          nota: registro.nota,
          centroCusto: registro.centroCusto,
          data: registro.criadoEm,
        });

        return acc;
      }, {})
    );

    plantasAgrupadas.forEach((p: any) => {
      const notas = p.avaliacoes.map((a: any) => a.nota);
      p.mediaNotas =
        notas.length > 0 ? notas.reduce((s: number, n: number) => s + n, 0) / notas.length : 0;
    });

    return plantasAgrupadas;

  } catch (e) {
    console.error("Erro ao carregar dados de avaliações:", e);
    return []; 
  }
};


export default function BotaoApagarEspecifico({ lote, planta, setAvaliacoes }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [senha, setSenha] = useState('');

  const confirmarApagar = async () => {
    if (senha === SENHA_ADMIN) {
      try {

        const chave = `${CHAVE_BASE}_${lote}`;
        const dadosBrutos = await AsyncStorage.getItem(chave);
        const dadosAtuais: Registro[] = dadosBrutos ? JSON.parse(dadosBrutos) : [];

        const dadosAtualizados = dadosAtuais.filter(item => item.planta !== planta);

        await AsyncStorage.setItem(chave, JSON.stringify(dadosAtualizados));

        setAvaliacoes(dadosAtualizados);

        setModalVisible(false);
        setSenha('');
        Alert.alert('✅ Apagado', `Avaliações da planta ${planta} do lote ${lote} foram apagadas.`);

      } catch (erro) {
        console.error('Erro ao apagar avaliações específicas: ', erro);
        Alert.alert('❌ Erro', 'Não foi possível apagar os dados.');
      }
    } else {
      Alert.alert('❌ Senha incorreta', 'Ação cancelada.');
      setSenha('');
    }
  };
 
  return ( 
    <View>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={{ backgroundColor: 'red', padding: 12, borderRadius: 8, marginBottom: 20 }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
           Apagar Planta {planta} do Lote {lote}
        </Text>
      </Pressable>
      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000099' }}>
          <View style={{ width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 12 }}>
            <Text style={{ marginBottom: 10, fontSize: 14, fontWeight: '700', color: '#FF0000', textAlign: 'center' }}>
              Ao confirmar, irá apagar todos os dados da Planta {planta} do Lote: {lote}
            </Text>
            <Text style={{ marginBottom: 10, fontSize: 16 }}>Digite a senha para confirmar:</Text>
            <TextInput
              value={senha}
              onChangeText={setSenha}
              placeholder="Senha"
              secureTextEntry
              style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginBottom: 15 }}
            />
            <Pressable onPress={confirmarApagar} style={{ backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, marginBottom: 10 }}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>Confirmar</Text>
            </Pressable>
            <Pressable onPress={() => { setModalVisible(false); setSenha(''); }} style={{ padding: 12, borderRadius: 8 }}>
              <Text style={{ textAlign: 'center', color: '#3b82f6' }}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}