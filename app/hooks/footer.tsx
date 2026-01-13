import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useCallback, useMemo, useState } from "react";

import { doencasPragas, locaPlanta, Registro } from "../../data/daodaAvaliacao";
import { salvarAvaliacoes } from "../../components/asyncStorage";
import ErrorBoundary from "../../components/ErrorBoundary";
import { gerarRelatorioDoLote } from "../../components/pdf";

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
        <View style={styles.footerContainer}>
            <Pressable 
                style={({pressed}) => [
                    styles.secondaryButton, 
                    pressed && {opacity: 0.8}
                ]}
                onPress={() => setMostrarResumo(!mostrarResumo)}
            >
                <Text style={styles.secondaryButtonText}>
                    {mostrarResumo ? "Ocultar Cálculo Técnico" : "Mostrar Cálculo Técnico"}
                </Text>
            </Pressable>

            {mostrarResumo && plantaSelecionada && (
                <View style={styles.summaryContainer}>
                    <ErrorBoundary>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryHeader}>
                                📊 Resumo - Planta {plantaSelecionada}
                            </Text>

                            {resumoDaPlanta.length === 0 ? (
                                <Text style={styles.emptyText}>
                                    Nenhum dado registrado para esta planta.
                                </Text>
                            ) : (
                                resumoDaPlanta
                                    .filter((item) =>
                                        item.orgaos?.some((o: any) => {
                                            if (item.tipo === "doenca") return (o.totalNotas ?? 0) > 0;
                                            else return ((o.totalBordadura ?? 0) > 0 || (o.totalArea ?? 0) > 0);
                                        })
                                    )
                                    .map((item, idx) => (
                                        <View key={item.nome + idx} style={styles.summaryItem}>
                                            <Text style={styles.summaryItemTitle}>
                                                {item.nome} — {item.percentualComposto?.toFixed(2) ?? 0}%
                                            </Text>

                                            {(item.orgaos || [])
                                                .filter((o: any) => {
                                                    if (item.tipo === "doenca") return (o.totalNotas ?? 0) > 0;
                                                    else return ((o.totalBordadura ?? 0) > 0 || (o.totalArea ?? 0) > 0);
                                                })
                                                .map((o: any, j: any) => (
                                                    <View key={o.nome + j} style={styles.organRow}>
                                                        <Text style={styles.organName}>• {o.nome}</Text>
                                                        {item.tipo === "doenca" ? (
                                                            <Text style={styles.organDetail}>
                                                                Total: {o.totalNotas ?? 0} ({ (o.porcentagem ?? 0).toFixed(2) }%)
                                                            </Text>
                                                        ) : (
                                                            <View>
                                                                <Text style={styles.organDetail}>
                                                                    Bord: {o.totalBordadura ?? 0} ({(o.porcentagemBordadura ?? 0).toFixed(2)}%)
                                                                </Text>
                                                                <Text style={styles.organDetail}>
                                                                    Área: {o.totalArea ?? 0} ({(o.porcentagemArea ?? 0).toFixed(2)}%)
                                                                </Text>
                                                                <Text style={[styles.organDetail, {fontWeight: 'bold'}]}>
                                                                    Média: {(o.porcentagemMedia ?? 0).toFixed(2)}%
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                ))}
                                        </View>
                                    ))
                            )}
                        </View>
                    </ErrorBoundary>
                </View>
            )}

            <View style={styles.plantGrid}>
                {plantas.map((p) => {
                    const temDados = plantasComDados.includes(p);
                    const isSelected = plantasSelecionadas.includes(p);
                    return (
                        <Pressable
                            key={p}
                            onPress={() => temDados && togglePlantaSelecionada(p)}
                            disabled={!temDados}
                            style={({ pressed }) => [
                                styles.plantButton,
                                !temDados && styles.plantButtonDisabled,
                                isSelected && styles.plantButtonSelected,
                                pressed && styles.plantButtonPressed
                            ]}
                        >
                            <Text style={[
                                styles.plantButtonText,
                                isSelected && styles.plantButtonTextSelected,
                                !temDados && styles.plantButtonTextDisabled
                            ]}>
                                P{p}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.actionButtons}>
                <Pressable
                    onPress={async () => {
                        await salvarAvaliacoes(avaliacoes, lote);
                        setAvaliacoes([]);
                        setResetKey((prevKey) => prevKey + 1);
                    }}
                    style={({ pressed }) => [
                        styles.primaryButton,
                        { backgroundColor: "#2563EB" }, 
                        pressed && styles.buttonPressed,
                        isSaving && styles.buttonDisabled
                    ]}
                    disabled={isSaving}
                >
                    <Text style={styles.primaryButtonText}>
                        {isSaving ? "Salvando..." : `💾 Salvar Lote ${lote}`}
                    </Text>
                </Pressable>

                <Pressable
                    onPress={async () => {
                        try {
                            await gerarRelatorioDoLote(lote, doencasPragas, nomeAvaliador);
                        } catch (error) {
                            Alert.alert("Erro", "Falha ao gerar relatório.");
                        }
                    }}
                    style={({ pressed }) => [
                        styles.primaryButton,
                        { backgroundColor: "#059669" }, 
                        pressed && styles.buttonPressed,
                        isSaving && styles.buttonDisabled
                    ]}
                    disabled={isSaving}
                >
                    <Text style={styles.primaryButtonText}>📄 Gerar PDF</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    footerContainer: {
        paddingVertical: 20,
    },
    
    secondaryButton: {
        alignSelf: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    secondaryButtonText: {
        color: '#000',
        fontWeight: '600',
        fontSize: 14,
    },

    summaryContainer: {
        marginBottom: 20,
    },
    summaryCard: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryHeader: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyText: {
        color: "#6B7280",
        textAlign: 'center',
        fontStyle: 'italic',
    },
    summaryItem: {
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    summaryItemTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 4,
    },
    organRow: {
        marginLeft: 8,
        marginTop: 4,
    },
    organName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
    },
    organDetail: {
        fontSize: 13,
        color: "#4B5563",
        marginLeft: 10,
    },

    plantGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 8,
        marginBottom: 24,
    },
    plantButton: {
        width: 45,
        height: 45,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    plantButtonDisabled: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
    },
    plantButtonSelected: {
        backgroundColor: '#000', 
        borderColor: '#000',
    },
    plantButtonPressed: {
        opacity: 0.7,
    },
    plantButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
    },
    plantButtonTextSelected: {
        color: '#fff',
    },
    plantButtonTextDisabled: {
        color: '#9CA3AF',
        fontWeight: 'normal',
    },

    actionButtons: {
        gap: 12,
        marginBottom: 20,
    },
    primaryButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    buttonDisabled: {
        backgroundColor: '#9CA3AF',
    }
});