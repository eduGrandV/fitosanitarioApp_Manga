import { Picker } from "@react-native-picker/picker";
import {
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useCallback, useMemo, useState } from "react";

import {
    DoencaPraga,
    doencasPragas,
    locaPlanta,
    Registro,
} from "../../data/daodaAvaliacao";




// ==================== HOOKS DE STATE ====================
export const useAvaliacaoScreenState = (numeroDePlantas: number) => {
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
      const handleLocalChange = useCallback((novoLocal: string) => {
        setLocal(novoLocal);
        const itemSelecionado = locaPlanta.find((item) => item.name === novoLocal);
        setCentroCustoSelecionado(
          itemSelecionado ? itemSelecionado.centroCusto : ""
        );
      }, []);

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
        handleLocalChange
    };
};

// ==================== HOOKS DE CALLBACKS ====================
export const useAvaliacaoCallbacks = ({
    setPlantaSelecionada,
    setFiltroSelecionado,
    
}: {
    setPlantaSelecionada: (p: number) => void;
    setFiltroSelecionado: (f: string) => void;
    
}) => {
    const handlePlantaChange = useCallback(
        (novaPlanta: number) => setPlantaSelecionada(novaPlanta),
        [setPlantaSelecionada]
    );

    

    const handleFiltroChange = useCallback(
        (novaDoenca: string) => setFiltroSelecionado(novaDoenca),
        [setFiltroSelecionado]
    );

    return { handlePlantaChange, handleFiltroChange };
};

// ==================== RENDER HEADER ====================
interface RenderHeaderProps {
    lote: string;
    plantas: number[];
    plantaSelecionada: number;
    handlePlantaChange: (p: number) => void;
    local?: string;
    handleLocalChange: (l: string) => void;
    filtroSelecionado: string;
    handleFiltroChange: (f: string) => void;
    nomeAvaliador: string;
    setNomeAvaliador: (v: string) => void;
    setAvaliacoes: (r: Registro[]) => void;
    centroCustoSelecionado: string
}

export const RenderHeader = ({
    lote,
    plantas,
    plantaSelecionada,
    handlePlantaChange,
    local,
    handleLocalChange,
    filtroSelecionado,
    handleFiltroChange,
    nomeAvaliador,
    setNomeAvaliador,
}: RenderHeaderProps) => {
    const itemSelecionado: DoencaPraga | undefined = useMemo(
        () => doencasPragas.find((d) => d.nome === filtroSelecionado),
        [filtroSelecionado]
    );
   
   
    

    return (
        <>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>
                    Avaliação de Quadrantes: <Text style={{ color: "#ff0000" }}>{lote}</Text>
                </Text>
            </View>

            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Digite seu nome aqui..."
                        placeholderTextColor="#94a3b8"
                        value={nomeAvaliador}
                        onChangeText={setNomeAvaliador}
                    />
                </View>
            </View>

            <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Selecione a Planta 🌱 :</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={plantaSelecionada}
                        style={styles.pickerInner}
                        onValueChange={handlePlantaChange}
                    >
                        {plantas?.map((p) => (
                            <Picker.Item key={p} label={`Planta ${p}`} value={p} />
                        ))}
                    </Picker>
                </View>
            </View>

            <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Selecionar o Lote:</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={local}
                        style={styles.pickerInner}
                        onValueChange={handleLocalChange}
                    >
                        <Picker.Item label="Selecione o local da planta" value={undefined} />
                        {locaPlanta.map((d) => (
                            <Picker.Item key={d.id.toString()} label={d.name} value={d.name} />
                        ))}
                    </Picker>
                </View>
            </View>

            <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Filtrar Doença/Praga:</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={filtroSelecionado}
                        style={styles.pickerInner}
                        onValueChange={handleFiltroChange}
                    >
                        {doencasPragas.map((d) => (
                            <Picker.Item key={d.nome} label={d.nome} value={d.nome} />
                        ))}
                    </Picker>
                </View>
            </View>



            {itemSelecionado && (
                <Text
                    style={[
                        styles.plantaHeader,
                        {
                            color: itemSelecionado.tipo === "doenca" ? "#065f46" : "#c2410c",
                        },
                    ]}
                >
                    {itemSelecionado.nome} - Planta {plantaSelecionada}
                </Text>
            )}
        </>
    );
};


// ==================== ESTILOS ====================
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
        paddingHorizontal: 10,
    },
    inputIcon: {
        fontSize: 20,
        paddingLeft: 4,
        color: "#94a3b8",
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: "#1e293b",
        fontWeight: "500",
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
        paddingHorizontal: 10,
        width: "70%",
    },
    pickerInner: {
        backgroundColor: "transparent",
        color: "#1e293b",
        height: 50,
    },
    pickerLabel: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 10,
        color: "#334155",
        marginLeft: 4,
    },
    plantaHeader: {
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 18,
        textAlign: "center",
        lineHeight: 24,
    },
});
