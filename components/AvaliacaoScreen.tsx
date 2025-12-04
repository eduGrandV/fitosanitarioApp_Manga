import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  doencasPragas,
  locaPlanta,
  Registro,
} from "../data/daodaAvaliacao";
import { useResumoPlanta } from "../app/hooks/useResumoPlanta";
import { RenderHeader } from "../app/hooks/header";
import { RenderFooter } from "../app/hooks/footer";
import OrgaoItem from "../app/hooks/orgao";
import { obterLocalizacaoComTime } from "./gps";

interface AvaliacaoScreenProps {
  numeroDePlantas: number;
  lote: string;
}

export default function AvaliacaoScreen({
  numeroDePlantas,
  lote,
}: AvaliacaoScreenProps) {
  const [avaliacoes, setAvaliacoes] = useState<Registro[]>([]);
  const [plantaSelecionada, setPlantaSelecionada] = useState<number>(1);
  const [local, setLocal] = useState<string>();
  const [filtroSelecionado, setFiltroSelecionado] = useState<string>(
    doencasPragas[0].nome
  );
  const [plantasSelecionadas, setPlantasSelecionadas] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [centroCustoSelecionado, setCentroCustoSelecionado] =
    useState<string>("");
  const [resetKey, setResetKey] = useState(0);
  const [nomeAvaliador, setNomeAvaliador] = useState<string>("");

  const togglePlantaSelecionada = useCallback((planta: number) => {
    setPlantasSelecionadas((prev) =>
      prev.includes(planta)
        ? prev.filter((p) => p !== planta)
        : [...prev, planta]
    );
  }, []);

  const plantas = useMemo(
    () => Array.from({ length: numeroDePlantas }, (_, i) => i + 1),
    [numeroDePlantas]
  );

  const handlePlantaChange = useCallback(
    (novaPlanta: number) => setPlantaSelecionada(novaPlanta),
    []
  );

  const handleLocalChange = useCallback((novoLocal: string) => {
    setLocal(novoLocal);
    const itemSelecionado = locaPlanta.find((item) => item.name === novoLocal);
    setCentroCustoSelecionado(
      itemSelecionado ? itemSelecionado.centroCusto : ""
    );
  }, []);

  const handleFiltroChange = useCallback(
    (novaDoenca: string) => setFiltroSelecionado(novaDoenca),
    []
  );

  const isLockedRef = useRef(false);

  const handleChange = useCallback(
    async (
      planta: number,
      doencaOuPraga: string,
      orgao: string,
      quadrante?: string,
      ramo?: string,
      localPicker?: string,
      numeroLocal?: number,
      nota?: number
    ) => {
      if (isLockedRef.current) return;
      if (!centroCustoSelecionado) {
        Alert.alert(
          "⚠️ Local não selecionado",
          "Por favor, selecione um Lote/Local da planta primeiro."
        );
        return;
      }
      if (!nomeAvaliador) {
        Alert.alert(
          "⚠️ Avaliador não identificado",
          "Por favor, digite seu nome antes de registrar."
        );
        return;
      }

      isLockedRef.current = true;
      setIsSaving(true);

      try {
        const pontoAtual = await obterLocalizacaoComTime(lote);

        setAvaliacoes((prev) => {
          const avaliacoesAtualizadas = prev.filter(
            (r) =>
              !(
                r.planta === planta &&
                r.doencaOuPraga === doencaOuPraga &&
                r.orgao === orgao &&
                (r.quadrante || null) === (quadrante || null) &&
                (r.ramo || null) === (ramo || null) &&
                (r.identificadorDeLocal || null) === (localPicker || null) &&
                (r.numeroLocal || null) === (numeroLocal || null)
              )
          );

          if (nota != null && nota >= 0) {
            const novoRegistro: Registro = {
              id: Date.now(),
              planta,
              doencaOuPraga,
              orgao,
              quadrante,
              ramo,
              nota,
              lote,
              centroCusto: centroCustoSelecionado,
              criadoEm: new Date().toISOString(),
              local: pontoAtual,
              localId: pontoAtual.id,
              identificadorDeLocal: localPicker || null,
              numeroLocal: numeroLocal || null,
              nomeAvaliador,
            };
            return [...avaliacoesAtualizadas, novoRegistro];
          }

          return avaliacoesAtualizadas;
        });
      } finally {
        setIsSaving(false);
        isLockedRef.current = false;
      }
    },
    [centroCustoSelecionado, lote, nomeAvaliador]
  );

  const handleCheckbox = useCallback(
    async (planta: number, doencaOuPraga: string, orgao: string) => {
      if (isLockedRef.current) return;

      if (!centroCustoSelecionado) {
        Alert.alert(
          "⚠️ Local não selecionado",
          "Por favor, selecione um Lote/Local da planta primeiro."
        );
        return;
      }
      if (!nomeAvaliador) {
        Alert.alert(
          "⚠️ Avaliador não identificado",
          "Por favor, digite seu nome antes de registrar."
        );
        return;
      }

      isLockedRef.current = true; 
      setIsSaving(true);

      try {
        const pontoAtual = await obterLocalizacaoComTime(lote);

        setAvaliacoes((prev) => {
          const existe = prev.find(
            (a) =>
              a.planta === planta &&
              a.doencaOuPraga === doencaOuPraga &&
              a.orgao === orgao
          );
          if (existe) {
            return prev.filter((a) => a.id !== existe.id);
          } else {
            const novoRegistro: Registro = {
              id: Date.now(),
              planta,
              doencaOuPraga,
              orgao,
              lote,
              centroCusto: centroCustoSelecionado,
              nota: 1,
              criadoEm: new Date().toISOString(),
              local: pontoAtual,
              localId: pontoAtual.id,
              identificadorDeLocal: null,
              numeroLocal: null,
              nomeAvaliador,
            };
            return [...prev, novoRegistro];
          }
        });
      } finally {
        setIsSaving(false);
        isLockedRef.current = false; // libera lock
      }
    },
    [centroCustoSelecionado, lote, nomeAvaliador]
  );

  const getCheckboxValue = useCallback(
    (planta: number, doencaOuPraga: string, orgao: string) =>
      avaliacoes.some(
        (a) =>
          a.planta === planta &&
          a.doencaOuPraga === doencaOuPraga &&
          a.orgao === orgao &&
          a.nota === 1
      ),
    [avaliacoes]
  );

  const getNota = useCallback(
    (
      planta: number,
      itemNome: string,
      orgaoNome: string,
      q: string,
      r?: string,
      localItem?: string,
      cc?: string
    ): number =>
      avaliacoes.find(
        (a) =>
          a.planta === planta &&
          a.doencaOuPraga === itemNome &&
          a.orgao === orgaoNome &&
          (a.quadrante || null) === (q || null) &&
          (a.ramo || null) === (r || null) &&
          (a.identificadorDeLocal || null) === (localItem || null) &&
          a.centroCusto === cc
      )?.nota ?? 0,
    [avaliacoes]
  );

  const itemSelecionado = useMemo(
    () => doencasPragas.find((d) => d.nome === filtroSelecionado),
    [filtroSelecionado]
  );

  const plantasComDados = useMemo(
    () => Array.from(new Set(avaliacoes.map((a) => a.planta))),
    [avaliacoes]
  );

  const resumoDaPlanta = useResumoPlanta(
    avaliacoes,
    plantaSelecionada,
    lote,
    centroCustoSelecionado
  );

  return (
    <SafeAreaView style={styles.container}>
      {isSaving && (
        <View 
  style={{ 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    justifyContent: "center", 
    alignItems: "center", 
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)"
  }}
>
  <ActivityIndicator size="large" color="#10b981" />
  <Text style={{ color: "#fff", fontSize: 16, marginTop: 8 }}>
    Capturando GPS...
  </Text>
</View>

      )}

      <FlatList
        ListHeaderComponent={
          <RenderHeader
            lote={lote}
            plantas={plantas}
            plantaSelecionada={plantaSelecionada}
            handlePlantaChange={handlePlantaChange}
            local={local}
            handleLocalChange={handleLocalChange}
            filtroSelecionado={filtroSelecionado}
            handleFiltroChange={handleFiltroChange}
            nomeAvaliador={nomeAvaliador}
            setNomeAvaliador={setNomeAvaliador}
            setAvaliacoes={setAvaliacoes}
            centroCustoSelecionado={centroCustoSelecionado}
          />
        }
        ListFooterComponent={
          <RenderFooter
            plantas={plantas}
            plantaSelecionada={plantaSelecionada}
            plantasComDados={plantasComDados}
            plantasSelecionadas={plantasSelecionadas}
            togglePlantaSelecionada={togglePlantaSelecionada}
            avaliacoes={avaliacoes}
            setAvaliacoes={setAvaliacoes}
            setResetKey={setResetKey}
            lote={lote}
            nomeAvaliador={nomeAvaliador}
            isSaving={isSaving}
            resumoDaPlanta={resumoDaPlanta}
          />
        }
        data={itemSelecionado ? itemSelecionado.orgaos : []}
        renderItem={({ item }) => (
          <OrgaoItem
            item={item}
            itemSelecionado={itemSelecionado}
            plantaSelecionada={plantaSelecionada}
            handleCheckbox={handleCheckbox}
            getCheckboxValue={getCheckboxValue}
            handleChange={handleChange}
            getNota={getNota}
            isSaving={isSaving}
            centroCustoSelecionado={centroCustoSelecionado}
          />
        )}
        keyExtractor={(item) => item.nome}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={1}
        maxToRenderPerBatch={5}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  logo: {
    width: "60%",
    height: 80,
    marginBottom: 30,
    resizeMode: "contain",
  },
  header: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    lineHeight: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    fontSize: 20,
    paddingLeft: 14,
    color: "#94a3b8",
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  inputFilled: {
    borderColor: "#3b82f6",
  },
  inputDisabled: {
    backgroundColor: "#f1f5f9",
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    paddingHorizontal: 10,
    width: "70%",
  },
  pickerInner: {
    backgroundColor: "transparent",
    color: "#1e293b",
    height: 50,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
  },
  modalBackground: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  loadingContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#334155",
    marginLeft: 4,
  },
  plantaCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  plantaHeader: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 18,
    textAlign: "center",
    lineHeight: 24,
  },
  unifiedCard: {
    marginBottom: 18,
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderLeftWidth: 5,
  },
  unifiedTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
    lineHeight: 22,
  },
  quadranteWrapper: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
  },
  quadranteText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginVertical: 10,
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryOrgan: {
    padding: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  button: {
    padding: 18,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    backgroundColor: "#10b981",
    borderWidth: 1,
    borderColor: "#059669",
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginBottom: 8,
  },
  checkboxBase: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderColor: "#999",
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#ff2c2c",
    borderColor: "#ff2c2c",
  },
  plantaSelecionadaButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    margin: 4,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
  },
});
