import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import debounce from "lodash/debounce";
import { quadrantes, ramos } from "../../data/daodaAvaliacao";

interface OrgaoItemProps {
  item: any;
  itemSelecionado: any;
  plantaSelecionada: number;
  handleCheckbox: (planta: number, itemNome: string, orgaoNome: string) => void;
  getCheckboxValue: (planta: number, itemNome: string, orgaoNome: string) => boolean;
  handleChange: (
    planta: number,
    itemNome: string,
    orgaoNome: string,
    q: string,
    r: string | undefined,
    localItem: string | undefined,
    extra: any,
    nota: number,
    cc: string
  ) => void;
  getNota: (
    planta: number,
    itemNome: string,
    orgaoNome: string,
    q: string,
    r: string | undefined,
    localItem: string | undefined,
    cc: string
  ) => number;
  isSaving: boolean;
  centroCustoSelecionado: string;
}

const OrgaoItem = React.memo(({
  item: orgao,
  itemSelecionado,
  plantaSelecionada,
  handleCheckbox,
  getCheckboxValue,
  handleChange,
  getNota,
  isSaving,
  centroCustoSelecionado,
}: OrgaoItemProps) => {

  // --- Inicializa notas ---
  const inicializarNotas = useCallback(() => {
    const notas: Record<string, number> = {};
    const locais = itemSelecionado.locais?.length ? itemSelecionado.locais : [undefined];
    locais.forEach((localItem: any) => {
      quadrantes.forEach((q) => {
        if (orgao.precisaRamo) {
          ramos.forEach((r) => {
            const key = `${localItem ?? "single"}-${q}-${r}`;
            notas[key] = getNota(plantaSelecionada, itemSelecionado.nome, orgao.nome, q, r, localItem, centroCustoSelecionado);
          });
        } else {
          const key = `${localItem ?? "single"}-${q}-single`;
          notas[key] = getNota(plantaSelecionada, itemSelecionado.nome, orgao.nome, q, undefined, localItem, centroCustoSelecionado);
        }
      });
    });
    return notas;
  }, [orgao, itemSelecionado, plantaSelecionada, getNota, centroCustoSelecionado]);

  const [notasLocais, setNotasLocais] = useState(inicializarNotas);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    setNotasLocais(inicializarNotas());
  }, [inicializarNotas]);

  const pickerItens = useMemo(() => {
    const max = Number(orgao.notaMax);
    return Array.from({ length: max + 1 }, (_, i) => ({ label: i.toString(), value: i }));
  }, [orgao.notaMax]);

  // Debounce global
  const updateGlobalState = (planta: number, itemNome: string, orgaoNome: string, q: string, r: string | undefined, localItem: string | undefined, nota: number) => {
    handleChange(planta, itemNome, orgaoNome, q, r, localItem, undefined, nota, centroCustoSelecionado);
  };
  const debouncedHandleChange = useCallback(debounce(updateGlobalState, 300), [handleChange, centroCustoSelecionado]);

  // Caso "INIMIGOS NATURAIS"
  if (itemSelecionado.nome === "INIMIGOS NATURAIS") {
    return (
      <View style={{ padding: 8 }}>
        <View style={styles.checkboxContainer}>
          <Text style={{ fontSize: 16, flex: 1 }}>{orgao.nome}</Text>
          <Pressable
            onPress={() => handleCheckbox(plantaSelecionada, itemSelecionado.nome, orgao.nome)}
            disabled={isSaving}
            style={[
              styles.checkboxBase,
              getCheckboxValue(plantaSelecionada, itemSelecionado.nome, orgao.nome) && styles.checkboxChecked,
            ]}
          />
        </View>
      </View>
    );
  }

  // --- Função que renderiza ramos ---
  const renderRamos = (q: string, localItem?: string) => {
    if (!orgao.precisaRamo) {
      const key = `${localItem ?? "single"}-${q}-single`;
      return (
        <View style={styles.pickerRow}>
          <View style={{ width: 40 }} />
          <DropDownPicker
          
            open={openKey === key}
            value={notasLocais[key] ?? 0}
            items={pickerItens}
            setOpen={() => setOpenKey(openKey === key ? null : key)}
            setValue={() => {}}
            onSelectItem={(item) => {
              const nota = Number(item.value);
              setNotasLocais(prev => ({ ...prev, [key]: nota }));
              debouncedHandleChange(plantaSelecionada, itemSelecionado.nome, orgao.nome, q, undefined, localItem, nota);
            }}
            disabled={isSaving}
            containerStyle={{...styles.pickerContainer, zIndex:1000 }}
            style={styles.pickerInner}
            dropDownContainerStyle={styles.dropDownContainer}
            listMode="MODAL"
            placeholder="0"
            zIndex={1000}
            zIndexInverse={1000}
          />
        </View>
      );
    }

    return (
      <FlatList
        data={ramos}
        horizontal={false}
        keyExtractor={(r) => r}
        renderItem={({ item: r, index: rIndex }) => {
          const key = `${localItem ?? "single"}-${q}-${r}`;
          return (
            <View style={[styles.pickerRow, { zIndex: 1000 - rIndex }]}>
              <Text style={{ width: 40 }}>{r}</Text>
              <DropDownPicker
                open={openKey === key}
                value={notasLocais[key] ?? 0}
                items={pickerItens}
                setOpen={() => setOpenKey(openKey === key ? null : key)}
                setValue={() => {}}
                onSelectItem={(item) => {
                  const nota = Number(item.value);
                  setNotasLocais(prev => ({ ...prev, [key]: nota }));
                  debouncedHandleChange(plantaSelecionada, itemSelecionado.nome, orgao.nome, q, r, localItem, nota);
                }}
                disabled={isSaving}
                containerStyle={styles.pickerContainer}
                style={styles.pickerInner}
                dropDownContainerStyle={styles.dropDownContainer}
                listMode="MODAL"
                placeholder="0"
                zIndex={1000 - rIndex}
                zIndexInverse={1000}
              />
            </View>
          );
        }}
      />
    );
  };

  // --- Função que renderiza quadrantes ---
  const renderQuadrantes = (localItem?: string) => (
    <FlatList
      data={quadrantes}
      keyExtractor={(q) => q}
      renderItem={({ item: q }) => (
        <View style={[styles.quadranteWrapper, { marginLeft: localItem ? 10 : 0 }]}>
          <Text style={[styles.quadranteText, { fontSize: 15 }]}>{q}</Text>
          <View style={styles.divider} />
          {renderRamos(q, localItem)}
        </View>
      )}
    />
  );

  // --- Render principal ---
  const locais = itemSelecionado.locais?.length ? itemSelecionado.locais : [undefined];

  return (
    <View style={[styles.unifiedCard, { borderLeftColor: itemSelecionado.tipo === "doenca" ? "#34d399" : "red" }]}>
      <Text style={[styles.unifiedTitle, { color: itemSelecionado.tipo === "doenca" ? "#065f46" : "#c2410c" }]}>
        {orgao.nome} (0–{orgao.notaMax})
      </Text>

      <FlatList
        data={locais}
        keyExtractor={(localItem) => localItem ?? "single"}
        renderItem={({ item: localItem }) => (
          <View style={{ paddingLeft: localItem ? 8 : 0 }}>
            {localItem && <Text style={styles.quadranteText}>{localItem.toUpperCase()}</Text>}
            {localItem && <View style={styles.divider} />}
            {renderQuadrantes(localItem)}
          </View>
        )}
      />
    </View>
  );
});

export default OrgaoItem;

const styles = StyleSheet.create({
  pickerContainer: { width: "90%" },
  pickerInner: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderWidth: 2,
    borderRadius: 12,
    height: 48,
    minHeight: 48,
  },
  dropDownContainer: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderWidth: 2,
    borderRadius: 12,
    maxHeight: 1000,
  },
  unifiedCard: { marginBottom: 18, padding: 16, backgroundColor: "#f8fafc", borderRadius: 12, borderLeftWidth: 5 },
  unifiedTitle: { fontSize: 17, fontWeight: "700", marginBottom: 10, lineHeight: 22 },
  quadranteWrapper: { marginBottom: 16, padding: 12, backgroundColor: "#f8fafc", borderRadius: 10 },
  quadranteText: { fontSize: 15, fontWeight: "600", color: "#475569", marginBottom: 6 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", marginVertical: 10 },
  pickerRow: { flexDirection: "row", alignItems: "center", marginBottom: 14, height: 150 },
  checkboxContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 8, backgroundColor: "#f8fafc", borderRadius: 8, marginBottom: 8 },
  checkboxBase: { width: 26, height: 26, borderWidth: 2, borderColor: "#999", borderRadius: 4, backgroundColor: "#fff" },
  checkboxChecked: { backgroundColor: "#ff2c2c", borderColor: "#ff2c2c" },
});
