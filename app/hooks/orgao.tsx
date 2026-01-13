import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import debounce from "lodash/debounce";
import { quadrantes, ramos } from "../../data/daodaAvaliacao";

interface OrgaoItemProps {
  item: any;
  itemSelecionado: any;
  plantaSelecionada: number;
  handleCheckbox: (planta: number, itemNome: string, orgaoNome: string) => void;
  getCheckboxValue: (
    planta: number,
    itemNome: string,
    orgaoNome: string
  ) => boolean;
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
  resetKey: number;
}

const OrgaoItem = React.memo(
  ({
    item: orgao,
    itemSelecionado,
    plantaSelecionada,
    handleCheckbox,
    getCheckboxValue,
    handleChange,
    getNota,
    isSaving,
    centroCustoSelecionado,
    resetKey,
  }: OrgaoItemProps) => {
    const locais = itemSelecionado.locais?.length
      ? itemSelecionado.locais
      : [undefined];

    const contextoKey = useMemo(() => {
      return `${resetKey}|${plantaSelecionada}|${itemSelecionado.nome}|${
        orgao.nome
      }|${JSON.stringify(locais)}|${centroCustoSelecionado}`;
    }, [
      resetKey,
      plantaSelecionada,
      itemSelecionado.nome,
      orgao.nome,
      locais,
      centroCustoSelecionado,
    ]);

    const notasDoBanco = useMemo(() => {
      const notas: Record<string, number> = {};
      locais.forEach((localItem: any) => {
        quadrantes.forEach((q) => {
          if (orgao.precisaRamo) {
            ramos.forEach((r) => {
              const key = `${localItem ?? "single"}-${q}-${r}`;
              notas[key] = getNota(
                plantaSelecionada,
                itemSelecionado.nome,
                orgao.nome,
                q,
                r,
                localItem,
                centroCustoSelecionado
              );
            });
          } else {
            const key = `${localItem ?? "single"}-${q}-single`;
            notas[key] = getNota(
              plantaSelecionada,
              itemSelecionado.nome,
              orgao.nome,
              q,
              undefined,
              localItem,
              centroCustoSelecionado
            );
          }
        });
      });
      return notas;
    }, [
      plantaSelecionada,
      itemSelecionado.nome,
      orgao.nome,
      locais,
      centroCustoSelecionado,
      getNota,
    ]);

    const [notasLocais, setNotasLocais] =
      useState<Record<string, number>>(notasDoBanco);
    const [openKey, setOpenKey] = useState<string | null>(null);

    useEffect(() => {
      setNotasLocais(notasDoBanco);
    }, [contextoKey]);

    const pickerItens = useMemo(() => {
      const max = Number(orgao.notaMax);
      return Array.from({ length: max + 1 }, (_, i) => ({
        label: i.toString(),
        value: i,
      }));
    }, [orgao.notaMax]);

    const debouncedHandleChange = useCallback(
      debounce((planta, itemNome, orgaoNome, q, r, localItem, nota) => {
        handleChange(
          planta,
          itemNome,
          orgaoNome,
          q,
          r,
          localItem,
          undefined,
          nota,
          centroCustoSelecionado
        );
      }, 300),
      [handleChange, centroCustoSelecionado]
    );

    if (itemSelecionado.nome === "INIMIGOS NATURAIS") {
      return (
        <View style={styles.cardContainer}>
          <View style={styles.checkboxContainer}>
            <Text style={styles.checkboxLabel}>{orgao.nome}</Text>
            <Pressable
              onPress={() =>
                handleCheckbox(
                  plantaSelecionada,
                  itemSelecionado.nome,
                  orgao.nome
                )
              }
              disabled={isSaving}
              style={[
                styles.checkboxBase,
                getCheckboxValue(
                  plantaSelecionada,
                  itemSelecionado.nome,
                  orgao.nome
                ) && styles.checkboxChecked,
              ]}
            >
              {getCheckboxValue(
                plantaSelecionada,
                itemSelecionado.nome,
                orgao.nome
              ) && (
                <Text style={{ color: "white", fontWeight: "bold" }}>✓</Text>
              )}
            </Pressable>
          </View>
        </View>
      );
    }

    const renderRamos = (q: string, localItem?: string) => {
      if (!orgao.precisaRamo) {
        const key = `${localItem ?? "single"}-${q}-single`;
        return (
          <View style={styles.pickerRow}>
            <DropDownPicker
              open={openKey === key}
              value={notasLocais[key] ?? 0}
              items={pickerItens}
              multiple={false}
              setOpen={() => setOpenKey(openKey === key ? null : key)}
              setValue={(callback) => {
                const nota = callback(notasLocais[key] ?? 0);
                setNotasLocais((prev) => ({ ...prev, [key]: nota }));
                debouncedHandleChange(
                  plantaSelecionada,
                  itemSelecionado.nome,
                  orgao.nome,
                  q,
                  undefined,
                  localItem,
                  nota
                );
              }}
              disabled={isSaving}
              listMode="MODAL"
              placeholder="0"
              style={styles.dropdownStyle}
              dropDownContainerStyle={styles.dropdownListStyle}
            />
          </View>
        );
      }

      return ramos.map((r, idx) => {
        const key = `${localItem ?? "single"}-${q}-${r}`;
        return (
          <View key={r} style={styles.pickerRow}>
            <Text style={styles.ramoLabel}>{r}</Text>
            <DropDownPicker
              open={openKey === key}
              value={notasLocais[key] ?? 0}
              items={pickerItens}
              multiple={false}
              setOpen={() => setOpenKey(openKey === key ? null : key)}
              setValue={(callback) => {
                const nota = callback(notasLocais[key] ?? 0);
                setNotasLocais((prev) => ({ ...prev, [key]: nota }));
                debouncedHandleChange(
                  plantaSelecionada,
                  itemSelecionado.nome,
                  orgao.nome,
                  q,
                  r,
                  localItem,
                  nota
                );
              }}
              disabled={isSaving}
              listMode="MODAL"
              placeholder="0"
              style={styles.dropdownStyle}
              dropDownContainerStyle={styles.dropdownListStyle}
            />
          </View>
        );
      });
    };

    return (
      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>
          {orgao.nome} (Max {orgao.notaMax})
        </Text>

        {locais.map((localItem: any, idx: number) => (
          <View key={localItem ?? idx}>
            {localItem && <Text style={styles.localTitle}>{localItem}</Text>}
            {quadrantes.map((q) => (
              <View key={q} style={styles.quadranteWrapper}>
                <Text style={styles.quadranteText}>{q}</Text>
                {renderRamos(q, localItem)}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }
);

export default OrgaoItem;

const styles = StyleSheet.create({
  cardContainer: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  localTitle: { fontSize: 16, fontWeight: "bold", marginTop: 8 },
  quadranteWrapper: { marginTop: 8 },
  quadranteText: { fontSize: 16, fontWeight: "bold" },
  pickerRow: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  ramoLabel: { width: 40, fontWeight: "bold" },
  dropdownStyle: { borderColor: "#000", height: 45 },
  dropdownListStyle: { borderColor: "#000" },
  checkboxContainer: { flexDirection: "row", justifyContent: "space-between" },
  checkboxLabel: { fontSize: 16, fontWeight: "bold" },
  checkboxBase: { width: 28, height: 28, borderWidth: 2, borderRadius: 6 },
  checkboxChecked: { backgroundColor: "#000" },
});
