import { Picker } from "@react-native-picker/picker";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useCallback, useMemo, useState } from "react";
import {
  DoencaPraga,
  doencasPragas,
  locaPlanta,
  Registro,
} from "../../data/daodaAvaliacao";

const LISTA_FAZENDAS = [
  { label: "Fortaleza 1 (F1)", valor: "GV-F1" },
  { label: "Fortaleza 2 (F2)", valor: "GV-F2" },
  { label: "Fortaleza 3 (F3)", valor: "GV-F3" },
  { label: "Fortaleza 5 (F5)", valor: "GV-F5" },
  { label: "Boa Esperança", valor: "GV-BE" },
  { label: "Vale Serra", valor: "GV-VS" },
];

export const useAvaliacaoScreenState = (numeroDePlantas: number) => {
  const [avaliacoes, setAvaliacoes] = useState<Registro[]>([]);
  const [plantaSelecionada, setPlantaSelecionada] = useState<number>(1);
  const [filtroSelecionado, setFiltroSelecionado] = useState<string>(
    doencasPragas[0].nome
  );
  const [nomeAvaliador, setNomeAvaliador] = useState<string>("");

  const [fazendaSelecionada, setFazendaSelecionada] = useState<string>("");
  const [local, setLocal] = useState<string>();
  const [centroCustoSelecionado, setCentroCustoSelecionado] =
    useState<string>("");

  const plantas = useMemo(
    () => Array.from({ length: numeroDePlantas }, (_, i) => i + 1),
    [numeroDePlantas]
  );

  const lotesFiltrados = useMemo(() => {
    if (!fazendaSelecionada) return [];
    return locaPlanta.filter((item) => item.name.includes(fazendaSelecionada));
  }, [fazendaSelecionada]);

  const handleFazendaChange = useCallback((novaFazenda: string) => {
    setFazendaSelecionada(novaFazenda);
    setLocal(undefined);
    setCentroCustoSelecionado("");
  }, []);

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
    handleLocalChange,
    fazendaSelecionada,
    handleFazendaChange,
    lotesFiltrados,
    listaFazendas: LISTA_FAZENDAS,
  };
};

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
  centroCustoSelecionado: string;

  fazendaSelecionada: string;
  handleFazendaChange: (f: string) => void;
  lotesFiltrados: any[];
  listaFazendas: typeof LISTA_FAZENDAS;
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
  fazendaSelecionada,
  handleFazendaChange,
  lotesFiltrados,
  listaFazendas,
}: RenderHeaderProps) => {
  const itemSelecionado = useMemo(
    () => doencasPragas.find((d) => d.nome === filtroSelecionado),
    [filtroSelecionado]
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Avaliação de Quadrantes</Text>
        <Text style={styles.headerSubtitle}>
          Lote: <Text style={styles.loteHighlight}>{lote || "---"}</Text>
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Nome do Avaliador 👤</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome..."
            placeholderTextColor="#666"
            value={nomeAvaliador}
            onChangeText={setNomeAvaliador}
          />
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>1. Selecione a Fazenda 🚜</Text>
        <View
          style={[
            styles.pickerWrapper,
            { borderColor: "#2563EB", borderWidth: 2 },
          ]}
        >
          <Picker
            selectedValue={fazendaSelecionada}
            style={styles.picker}
            onValueChange={handleFazendaChange}
            dropdownIconColor="#000"
          >
            <Picker.Item
              label="Toque para selecionar..."
              value=""
              color="#666"
              style={{ fontSize: 16 }}
            />
            {listaFazendas.map((fazenda) => (
              <Picker.Item
                key={fazenda.valor}
                label={fazenda.label}
                value={fazenda.valor}
                color="#000"
                style={{ fontSize: 16, fontWeight: "bold" }}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>2. Selecione o Lote 📍</Text>
        <View
          style={[
            styles.pickerWrapper,
            {
              opacity: fazendaSelecionada ? 1 : 0.5,
              backgroundColor: fazendaSelecionada ? "#fff" : "#f3f4f6",
            },
          ]}
        >
          <Picker
            selectedValue={local}
            style={styles.picker}
            onValueChange={handleLocalChange}
            dropdownIconColor="#000"
            enabled={!!fazendaSelecionada}
          >
            <Picker.Item
              label={
                fazendaSelecionada
                  ? "Escolha o lote..."
                  : "Selecione a fazenda acima primeiro ⬆️"
              }
              value={undefined}
              color="#666"
              style={{ fontSize: 16 }}
            />
            {lotesFiltrados.map((d) => (
              <Picker.Item
                key={d.id.toString()}
                label={d.name}
                value={d.name}
                color="#000"
                style={{ fontSize: 16 }}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.rowContainer}>
        <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Planta 🌱</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={plantaSelecionada}
              style={styles.picker}
              onValueChange={handlePlantaChange}
              dropdownIconColor="#000"
            >
              {plantas?.map((p) => (
                <Picker.Item
                  key={p}
                  label={`P${p}`}
                  value={p}
                  color="#000"
                  style={{ fontSize: 16 }}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={[styles.fieldContainer, { flex: 1 }]}>
          <Text style={styles.label}>Praga/Doença 🔍</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={filtroSelecionado}
              style={styles.picker}
              onValueChange={handleFiltroChange}
              dropdownIconColor="#000"
            >
              {doencasPragas.map((d) => (
                <Picker.Item
                  key={d.nome}
                  label={d.nome}
                  value={d.nome}
                  color="#000"
                  style={{ fontSize: 14 }}
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {itemSelecionado && (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            <Text style={{ fontWeight: "bold" }}>{itemSelecionado.nome}</Text> —
            Planta {plantaSelecionada}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  headerContainer: {
    alignItems: "center",
    marginVertical: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  loteHighlight: {
    color: "#D32F2F",
    fontWeight: "bold",
  },
  fieldContainer: {
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000000",
    height: 50,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  pickerWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000000",
    overflow: "hidden",
    height: 50,
    justifyContent: "center",
  },
  picker: {
    width: "100%",
    color: "#000000",
  },
  statusCard: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000000",
    alignItems: "center",
  },
  statusText: {
    fontSize: 18,
    color: "#000000",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
});
