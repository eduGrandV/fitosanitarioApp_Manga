import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  FlatList,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  doencasPragas,
  locaPlanta,
  Registro,
  PontoLocalizacao,
} from "../data/daodaAvaliacao";

import { useResumoPlanta } from "../app/hooks/useResumoPlanta";
import { RenderHeader, useAvaliacaoScreenState } from "../app/hooks/header";
import { RenderFooter } from "../app/hooks/footer";
import OrgaoItem from "../app/hooks/orgao";
import { obterLocalizacaoComTime, localizacaoPadrao } from "./gps";

interface ModalMapGPSProps {
  visible: boolean;
  status: "ocioso" | "buscando" | "aguardando_confirmacao" | "erro";
  coordenadas?: { lat: number; long: number; acc?: number } | null;
  exibirAvisoRecalculo: boolean;
  onConfirm: () => void;
  onRecalculate: () => void;
  onCancel: () => void;
  onForceLocation: () => void;
}

const ModalMapGPS = ({
  visible,
  status,
  coordenadas,
  exibirAvisoRecalculo,
  onConfirm,
  onRecalculate,
  onCancel,
  onForceLocation,
}: ModalMapGPSProps) => {
  if (!visible || status === "ocioso") return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          {status === "buscando" && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.modalTitle}>Buscando Satélite...</Text>
              <Text style={styles.modalSub}>Aguarde a triangulação 🛰️</Text>
              <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
                Sem internet demora um pouco mais.
              </Text>
            </View>
          )}

          {status === "erro" && (
            <View style={styles.loadingContainer}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>⚠️</Text>
              <Text style={styles.modalTitle}>Sinal de GPS Fraco</Text>
              <Text style={styles.modalSub}>O satélite não respondeu.</Text>

              <View style={styles.errorButtons}>
                <TouchableOpacity
                  onPress={onRecalculate}
                  style={[styles.btnBase, styles.btnRetry]}
                >
                  <Text style={styles.btnTextWhite}>🔄 Tentar Novamente</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onForceLocation}
                  style={[
                    styles.btnBase,
                    { backgroundColor: "#f59e0b", marginTop: 8 },
                  ]}
                >
                  <Text style={[styles.btnTextWhite, { color: "#78350f" }]}>
                    📍 Usar Local Padrão
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onCancel}
                  style={[styles.btnBase, styles.btnCancel, { marginTop: 8 }]}
                >
                  <Text style={styles.btnTextSec}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {status === "aguardando_confirmacao" && coordenadas && (
            <View
              style={{
                flex: 1,
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {exibirAvisoRecalculo && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningTitle}>
                    ⚠️ Localização Aproximada
                  </Text>
                  <Text style={styles.warningText}>
                    O GPS falhou e estamos usando a referência do lote.
                  </Text>
                </View>
              )}

              <View style={{ marginVertical: 15, alignItems: "center" }}>
                <Text style={{ fontSize: 60 }}>
                  {exibirAvisoRecalculo ? "⚠️" : "📍"}
                </Text>
              </View>

              <View style={styles.dataBox}>
                <Text style={styles.label}>Latitude</Text>
                <Text style={styles.value}>{coordenadas.lat.toFixed(6)}</Text>
                <View style={styles.divider} />
                <Text style={styles.label}>Longitude</Text>
                <Text style={styles.value}>{coordenadas.long.toFixed(6)}</Text>
                <View style={styles.divider} />
                <Text style={styles.label}>Precisão</Text>
                <Text
                  style={[
                    styles.value,
                    {
                      color:
                        (coordenadas.acc || 0) > 20 ? "#ef4444" : "#15803d",
                    },
                  ]}
                >
                  ±{(coordenadas.acc || 0).toFixed(0)}m
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={onRecalculate}
                  style={[styles.btnBase, styles.btnRecalc]}
                >
                  <Text style={styles.btnTextSec}>🔄 Recalcular</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onConfirm}
                  style={[styles.btnBase, styles.btnConfirm]}
                >
                  <Text style={styles.btnTextWhite}>✅ Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

interface AvaliacaoScreenProps {
  numeroDePlantas: number;
  lote: string;
}

type NumericPayload = {
  planta: number;
  doencaOuPraga: string;
  orgao: string;
  quadrante?: string;
  ramo?: string;
  localPicker?: string;
  numeroLocal?: number;
  nota: number;
};

type CheckboxPayload = {
  planta: number;
  doencaOuPraga: string;
  orgao: string;
};

type PendingAction =
  | { type: "numeric"; payload: NumericPayload }
  | { type: "checkbox"; payload: CheckboxPayload };

export default function AvaliacaoScreen({
  numeroDePlantas,
  lote: loteInicial,
}: AvaliacaoScreenProps) {
  const {
    avaliacoes,
    setAvaliacoes,
    plantaSelecionada,
    setPlantaSelecionada,
    filtroSelecionado,
    setFiltroSelecionado,
    nomeAvaliador,
    setNomeAvaliador,
    local,
    handleLocalChange,
    centroCustoSelecionado,
    plantas,
    fazendaSelecionada,
    handleFazendaChange,
    lotesFiltrados,
    listaFazendas,
  } = useAvaliacaoScreenState(numeroDePlantas);

  const [plantasSelecionadas, setPlantasSelecionadas] = useState<number[]>([]);
  const [resetKey, setResetKey] = useState(0);

  const [gpsStatus, setGpsStatus] = useState<
    "ocioso" | "buscando" | "aguardando_confirmacao" | "erro"
  >("ocioso");
  const [gpsInfo, setGpsInfo] = useState<{
    lat: number;
    long: number;
    acc?: number;
  } | null>(null);

  const [registroPendente, setRegistroPendente] =
    useState<PendingAction | null>(null);
  const isLockedRef = useRef(false);
  const [tentativasFallback, setTentativasFallback] = useState(0);

  const togglePlantaSelecionada = useCallback((planta: number) => {
    setPlantasSelecionadas((prev) =>
      prev.includes(planta)
        ? prev.filter((p) => p !== planta)
        : [...prev, planta],
    );
  }, []);

  const handlePlantaChange = useCallback(
    (novaPlanta: number) => setPlantaSelecionada(novaPlanta),
    [setPlantaSelecionada],
  );
  const handleFiltroChange = useCallback(
    (novaDoenca: string) => setFiltroSelecionado(novaDoenca),
    [setFiltroSelecionado],
  );

  const buscarGPS = async () => {
    setGpsStatus("buscando");
    try {
      const referenciaGPS = local || loteInicial || "DESCONHECIDO";

      const pontoAtual: any = await obterLocalizacaoComTime(referenciaGPS);

      const isFallback =
        pontoAtual.latitude === localizacaoPadrao.latitude &&
        pontoAtual.longitude === localizacaoPadrao.longitude;

      if (isFallback) {
        setTentativasFallback((prev) => prev + 1);
      } else {
        setTentativasFallback(0);
      }

      setGpsInfo({
        lat: pontoAtual.latitude,
        long: pontoAtual.longitude,
        acc: pontoAtual.accuracy ?? 0,
      });
      setGpsStatus("aguardando_confirmacao");
    } catch (error) {
      setGpsStatus("erro");
    }
  };

  const iniciarFluxoDeRegistro = (action: PendingAction) => {
    if (isLockedRef.current) return;
    if (!centroCustoSelecionado) {
      Alert.alert(
        "⚠️ Local não selecionado",
        "Selecione a Fazenda e o Lote primeiro.",
      );
      return;
    }
    if (!nomeAvaliador) {
      Alert.alert("⚠️ Avaliador não identificado", "Digite seu nome.");
      return;
    }

    setTentativasFallback(0);
    isLockedRef.current = true;
    setRegistroPendente(action);
    buscarGPS();
  };

  const handleRecalculate = () => {
    buscarGPS();
  };

  const handleForceLocation = () => {
    setGpsInfo({
      lat: localizacaoPadrao.latitude,
      long: localizacaoPadrao.longitude,
      acc: 999,
    });
    setTentativasFallback(2);
    setGpsStatus("aguardando_confirmacao");
  };

  const handleCancel = () => {
    setGpsStatus("ocioso");
    setRegistroPendente(null);
    setGpsInfo(null);
    setTentativasFallback(0);
    isLockedRef.current = false;
  };

  const handleConfirm = () => {
    if (!registroPendente || !gpsInfo) return;

    const loteNumeroReal = loteInicial || "SEM_LOTE";

    const pontoConfirmado: PontoLocalizacao = {
      id: Date.now(),
      lote: loteNumeroReal,
      latitude: gpsInfo.lat,
      longitude: gpsInfo.long,
      timestamp: Date.now(),
      accuracy: gpsInfo.acc,
    };

    const nomeDoLote = local || null;
    const centroCustoParaSalvar = centroCustoSelecionado;

    if (registroPendente.type === "numeric") {
      const {
        planta,
        doencaOuPraga,
        orgao,
        quadrante,
        ramo,
        localPicker,
        numeroLocal,
        nota,
      } = registroPendente.payload;

      const localFinal = localPicker ? localPicker : nomeDoLote;

      setAvaliacoes((prev) => {
        const avaliacoesAtualizadas = prev.filter(
          (r) =>
            !(
              r.planta === planta &&
              r.doencaOuPraga === doencaOuPraga &&
              r.orgao === orgao &&
              (r.quadrante || null) === (quadrante || null) &&
              (r.ramo || null) === (ramo || null) &&
              (r.identificadorDeLocal || null) === (localFinal || null) &&
              (r.numeroLocal || null) === (numeroLocal || null)
            ),
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
            lote: loteNumeroReal,
            centroCusto: centroCustoParaSalvar,
            criadoEm: new Date().toISOString(),
            local: pontoConfirmado,
            localId: pontoConfirmado.id,

            identificadorDeLocal: localFinal,

            numeroLocal: numeroLocal || null,
            nomeAvaliador,
          };
          return [...avaliacoesAtualizadas, novoRegistro];
        }
        return avaliacoesAtualizadas;
      });
    } else if (registroPendente.type === "checkbox") {
      const { planta, doencaOuPraga, orgao } = registroPendente.payload;

      setAvaliacoes((prev) => {
        const existe = prev.find(
          (a) =>
            a.planta === planta &&
            a.doencaOuPraga === doencaOuPraga &&
            a.orgao === orgao,
        );
        if (existe) {
          return prev.filter((a) => a.id !== existe.id);
        } else {
          const novoRegistro: Registro = {
            id: Date.now(),
            planta,
            doencaOuPraga,
            orgao,
            lote: loteNumeroReal,
            centroCusto: centroCustoParaSalvar,
            nota: 1,
            criadoEm: new Date().toISOString(),
            local: pontoConfirmado,
            localId: pontoConfirmado.id,

            identificadorDeLocal: nomeDoLote,

            numeroLocal: null,
            nomeAvaliador,
          };
          return [...prev, novoRegistro];
        }
      });
    }
    handleCancel();
  };

  const handleChange = useCallback(
    (
      planta: number,
      doencaOuPraga: string,
      orgao: string,
      quadrante: string | undefined,
      ramo: string | undefined,
      localPicker: string | undefined,
      numeroLocal: number | undefined,
      nota: number,
    ) => {
      iniciarFluxoDeRegistro({
        type: "numeric",
        payload: {
          planta,
          doencaOuPraga,
          orgao,
          quadrante,
          ramo,
          localPicker,
          numeroLocal,
          nota,
        },
      });
    },
    [centroCustoSelecionado, local, nomeAvaliador],
  );

  const handleCheckbox = useCallback(
    (planta: number, doencaOuPraga: string, orgao: string) => {
      iniciarFluxoDeRegistro({
        type: "checkbox",
        payload: { planta, doencaOuPraga, orgao },
      });
    },
    [centroCustoSelecionado, local, nomeAvaliador],
  );

  const getCheckboxValue = useCallback(
    (planta: number, doencaOuPraga: string, orgao: string) =>
      avaliacoes.some(
        (a) =>
          a.planta === planta &&
          a.doencaOuPraga === doencaOuPraga &&
          a.orgao === orgao &&
          a.nota === 1,
      ),
    [avaliacoes],
  );

  const getNota = useCallback(
    (
      planta: number,
      itemNome: string,
      orgaoNome: string,
      q: string,
      r?: string,
      localItem?: string,
      cc?: string,
    ): number =>
      avaliacoes.find(
        (a) =>
          a.planta === planta &&
          a.doencaOuPraga === itemNome &&
          a.orgao === orgaoNome &&
          (a.quadrante || null) === (q || null) &&
          (a.ramo || null) === (r || null) &&
          (a.identificadorDeLocal || null) === (localItem || null) &&
          (a.centroCusto === cc || a.centroCusto === local),
      )?.nota ?? 0,
    [avaliacoes, local],
  );

  const itemSelecionado = useMemo(
    () => doencasPragas.find((d) => d.nome === filtroSelecionado),
    [filtroSelecionado],
  );
  const plantasComDados = useMemo(
    () => Array.from(new Set(avaliacoes.map((a) => a.planta))),
    [avaliacoes],
  );

  const resumoDaPlanta = useResumoPlanta(
    avaliacoes,
    plantaSelecionada,
    local || loteInicial,
    centroCustoSelecionado,
    numeroDePlantas,
  );

  return (
    <SafeAreaView style={styles.container}>
      <ModalMapGPS
        visible={gpsStatus !== "ocioso"}
        status={gpsStatus}
        coordenadas={gpsInfo}
        exibirAvisoRecalculo={tentativasFallback > 1}
        onConfirm={handleConfirm}
        onRecalculate={handleRecalculate}
        onCancel={handleCancel}
        onForceLocation={handleForceLocation}
      />

      <FlatList
        ListHeaderComponent={
          <RenderHeader
            lote={loteInicial}
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
            fazendaSelecionada={fazendaSelecionada}
            handleFazendaChange={handleFazendaChange}
            lotesFiltrados={lotesFiltrados}
            listaFazendas={listaFazendas}
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
            lote={loteInicial}
            nomeAvaliador={nomeAvaliador}
            isSaving={gpsStatus !== "ocioso"}
            resumoDaPlanta={resumoDaPlanta}
            centroCustoSelecionado={centroCustoSelecionado}
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
            isSaving={gpsStatus !== "ocioso"}
            centroCustoSelecionado={centroCustoSelecionado}
            resetKey={resetKey}
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
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    height: 520,
    padding: 16,
    alignItems: "center",
    elevation: 10,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 12,
  },
  modalSub: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    marginBottom: 10,
  },

  warningBox: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: "100%",
  },
  warningTitle: {
    color: "#b45309",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  warningText: { color: "#92400e", fontSize: 14 },

  dataBox: {
    backgroundColor: "#f1f5f9",
    width: "100%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  label: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
    textAlign: "center",
  },
  value: {
    fontSize: 20,
    color: "#1e293b",
    fontWeight: "bold",
    fontFamily: "monospace",
    textAlign: "center",
  },
  divider: { height: 1, backgroundColor: "#cbd5e1", marginVertical: 8 },

  buttonRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  errorButtons: { marginTop: 20, width: "100%", gap: 10 },
  btnBase: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  btnRecalc: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  btnConfirm: { flex: 1, backgroundColor: "#10b981" },
  btnRetry: { backgroundColor: "#3b82f6", width: "100%" },
  btnCancel: { backgroundColor: "#e2e8f0", width: "100%" },
  btnTextWhite: { color: "white", fontWeight: "bold", fontSize: 16 },
  btnTextSec: { color: "#334155", fontWeight: "bold", fontSize: 16 },
});
