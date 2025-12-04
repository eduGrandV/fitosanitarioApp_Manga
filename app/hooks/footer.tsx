import { Alert, Button, Pressable, StyleSheet, Text, View } from "react-native";
import { useCallback, useMemo, useState } from "react";

import { doencasPragas, locaPlanta, Registro } from "../../data/daodaAvaliacao";
import { salvarAvaliacoes } from "../../components/asyncStorage";
import ErrorBoundary from "../../components/ErrorBoundary";
import { gerarRelatorioDoLote } from "../../components/pdf";


// ==================== HOOKS DE STATE ====================
export const useAvaliacaoScreenState = (
    numeroDePlantas: number,
    lote: string
) => {
    const [avaliacoes, setAvaliacoes] = useState<Registro[]>([]);
    const [plantaSelecionada, setPlantaSelecionada] = useState<number>(1);
    const [filtroSelecionado, setFiltroSelecionado] = useState<string>(
        doencasPragas[0].nome
    );
    const [nomeAvaliador, setNomeAvaliador] = useState<string>("");
    const [local, setLocal] = useState<string>();
    const [centroCustoSelecionado, setCentroCustoSelecionado] =
        useState<string>("");

    const plantas = useMemo(
        () => Array.from({ length: numeroDePlantas }, (_, i) => i + 1),
        [numeroDePlantas]
    );

    return {
        avaliacoes,
        setAvaliacoes,
        plantaSelecionada,
        setPlantaSelecionada,
        filtroSelecionado,
        setFiltroSelecionado,
        nomeAvaliador,
        setNomeAvaliador,
        local,
        setLocal,
        centroCustoSelecionado,
        setCentroCustoSelecionado,
        plantas,
    };
};

// ==================== HOOKS DE CALLBACKS ====================
export const useAvaliacaoCallbacks = ({
    setPlantaSelecionada,
    setFiltroSelecionado,
    setLocal,
    setCentroCustoSelecionado,
}: {
    setPlantaSelecionada: (p: number) => void;
    setFiltroSelecionado: (f: string) => void;
    setLocal: (l: string) => void;
    setCentroCustoSelecionado: (c: string) => void;
}) => {
    const handlePlantaChange = useCallback(
        (novaPlanta: number) => setPlantaSelecionada(novaPlanta),
        [setPlantaSelecionada]
    );

    const handleLocalChange = useCallback(
        (novoLocal: string) => {
            setLocal(novoLocal);
            const itemSelecionado = locaPlanta.find(
                (item) => item.name === novoLocal
            );
            setCentroCustoSelecionado(itemSelecionado?.centroCusto || "");
        },
        [setLocal, setCentroCustoSelecionado]
    );

    const handleFiltroChange = useCallback(
        (novaDoenca: string) => setFiltroSelecionado(novaDoenca),
        [setFiltroSelecionado]
    );

    return { handlePlantaChange, handleLocalChange, handleFiltroChange };
};

// ==================== RENDER FOOTER ====================
interface RenderFooterProps {
    plantas: number[];
    plantaSelecionada: number;
    plantasComDados: number[];
    plantasSelecionadas: number[];
    togglePlantaSelecionada: (p: number) => void;
    avaliacoes: Registro[];
    setAvaliacoes: (r: Registro[]) => void;
    setResetKey: (fn: (prev: number) => number) => void;
    lote: string;
    nomeAvaliador: string;
    isSaving: boolean;
    resumoDaPlanta: any[];
}

export const RenderFooter = ({
    plantas,
    plantaSelecionada,
    plantasComDados,
    plantasSelecionadas,
    togglePlantaSelecionada,
    avaliacoes,
    setAvaliacoes,
    setResetKey,
    lote,
    nomeAvaliador,
    resumoDaPlanta,
    isSaving,
}: RenderFooterProps) => {

    const [mostrarResumo, setMostrarResumo] = useState(false);

    return (
        <>
            <Button title="Mostrar Cálculo Técnico" onPress={() => setMostrarResumo(true)} />


            {mostrarResumo && (
                 <View>
                {plantaSelecionada && (
                    <ErrorBoundary>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>
                                📊 Cálculo Técnico - Planta {plantaSelecionada}
                            </Text>

                            {resumoDaPlanta.length === 0 ? (
                                <Text style={{ color: "#6b7280" }}>
                                    Nenhum dado registrado para esta planta.
                                </Text>
                            ) : (
                                resumoDaPlanta
                             
                                    .filter((item) =>
                                        item.orgaos?.some((o: any) => {
                                            if (item.tipo === "doenca") return (o.totalNotas ?? 0) > 0;
                                            else
                                                return (
                                                    (o.totalBordadura ?? 0) > 0 ||
                                                    (o.totalArea ?? 0) > 0
                                                );
                                        })
                                    )
                                    .map((item, idx) => (
                                        <View key={item.nome + idx} style={{ marginBottom: 12 }}>
                                            {/* Título da doença/praga */}
                                            <Text
                                                style={{
                                                    fontWeight: "700",
                                                    fontSize: 16,
                                                    color: item.tipo === "doenca" ? "#065f46" : "#c2410c",
                                                    marginBottom: 6,
                                                }}
                                            >
                                                {item.nome} — {item.percentualComposto?.toFixed(2) ?? 0}%
                                            </Text>

                                            {/* Detalhamento dos órgãos */}
                                            {(item.orgaos || [])
                                                .filter((o: any) => {
                                                    if (item.tipo === "doenca") return (o.totalNotas ?? 0) > 0;
                                                    else
                                                        return (
                                                            (o.totalBordadura ?? 0) > 0 ||
                                                            (o.totalArea ?? 0) > 0
                                                        );
                                                })
                                                .map((o: any, j: any) => (
                                                    <View key={o.nome + j} style={{ marginLeft: 12, marginBottom: 4 }}>
                                                        <Text style={{ fontWeight: "600", color: "#1e293b" }}>
                                                            • {o.nome}
                                                        </Text>

                                                        {item.tipo === "doenca" ? (
                                                            <Text style={{ color: "#334155" }}>
                                                                Total: {o.totalNotas ?? 0} — %:{" "}
                                                                {(o.porcentagem ?? 0).toFixed(2)}%
                                                            </Text>
                                                        ) : (
                                                            <>
                                                                <Text style={{ color: "#334155" }}>
                                                                    Bordadura: {o.totalBordadura ?? 0} —{" "}
                                                                    {(o.porcentagemBordadura ?? 0).toFixed(2)}%
                                                                </Text>
                                                                <Text style={{ color: "#334155" }}>
                                                                    Área interna: {o.totalArea ?? 0} —{" "}
                                                                    {(o.porcentagemArea ?? 0).toFixed(2)}%
                                                                </Text>
                                                                <Text style={{ color: "#334155" }}>
                                                                    Média: {(o.porcentagemMedia ?? 0).toFixed(2)}%
                                                                </Text>
                                                            </>
                                                        )}
                                                    </View>
                                                ))}
                                        </View>
                                    ))
                            )}
                        </View>
                    </ErrorBoundary>
                )}
            </View>
            )}
           




            <View style={styles.buttonContainer}>
                <View
                    style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        marginBottom: 12,
                    }}
                >
                    {plantas.map((p) => {
                        const temDados = plantasComDados.includes(p);
                        return (
                            <Pressable
                                key={p}
                                onPress={() => temDados && togglePlantaSelecionada(p)}
                                disabled={!temDados}
                                style={({ pressed }) => [
                                    styles.plantaSelecionadaButton,
                                    {
                                        backgroundColor: !temDados
                                            ? "#e2e8f0"
                                            : plantasSelecionadas.includes(p)
                                                ? "#10b981"
                                                : "#f1f5f9",
                                        borderColor: !temDados
                                            ? "#cbd5e1"
                                            : plantasSelecionadas.includes(p)
                                                ? "#059669"
                                                : "#cbd5e1",
                                        opacity: pressed ? 0.7 : 1,
                                    },
                                ]}
                            >
                                <Text
                                    style={{
                                        fontWeight: "600",
                                        color:
                                            temDados && plantasSelecionadas.includes(p)
                                                ? "#fff"
                                                : "#334155",
                                    }}
                                >
                                    P{p}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <Pressable
                    onPress={async () => {
                        await salvarAvaliacoes(avaliacoes, lote);
                        setAvaliacoes([]);
                        setResetKey((prevKey) => prevKey + 1);
                    }}
                    style={({ pressed }) => [
                        styles.button,
                        { backgroundColor: "#3b82f6" },
                        pressed && styles.buttonPressed,
                    ]}
                    disabled={isSaving}
                >
                    <Text style={styles.buttonText}>💾 Salvar Dados do Lote {lote}</Text>
                </Pressable>

                <Pressable
                    onPress={async () => {
                        try {
                            await gerarRelatorioDoLote(lote, doencasPragas, nomeAvaliador);
                        } catch (error) {
                            console.error("Erro ao gerar relatório:", error);
                            Alert.alert("Erro", "Não foi possível gerar o relatório.");
                        }
                    }}
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed,
                    ]}
                    disabled={isSaving}
                >
                    <Text style={styles.buttonText}>Gerar Relatório</Text>
                </Pressable>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        marginTop: 24,
        marginBottom: 40,
        gap: 12,
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
    summaryTitle: {},

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
    buttonText: {},
    buttonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
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
