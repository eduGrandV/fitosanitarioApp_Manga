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
    orgaoNome: string,
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
    cc: string,
  ) => void;
  getNota: (
    planta: number,
    itemNome: string,
    orgaoNome: string,
    q: string,
    r: string | undefined,
    localItem: string | undefined,
    cc: string,
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
                centroCustoSelecionado,
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
              centroCustoSelecionado,
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
          centroCustoSelecionado,
        );
      }, 300),
      [handleChange, centroCustoSelecionado],
    );

    if (itemSelecionado.nome === "INIMIGOS NATURAIS") {
      return (
        <View style={styles.cardContainer}>
          <Pressable
            onPress={() =>
              handleCheckbox(
                plantaSelecionada,
                itemSelecionado.nome,
                orgao.nome,
              )
            }
            disabled={isSaving}
            style={styles.checkboxRow}
          >
            <Text style={styles.checkboxLabel}>{orgao.nome}</Text>
            <View
              style={[
                styles.checkboxBase,
                getCheckboxValue(
                  plantaSelecionada,
                  itemSelecionado.nome,
                  orgao.nome,
                ) && styles.checkboxChecked,
              ]}
            >
              {getCheckboxValue(
                plantaSelecionada,
                itemSelecionado.nome,
                orgao.nome,
              ) && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </Pressable>
        </View>
      );
    }

    const renderRamos = (q: string, localItem?: string) => {
      if (!orgao.precisaRamo) {
        const key = `${localItem ?? "single"}-${q}-single`;
        return (
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Nota Geral</Text>
            <View style={styles.dropdownWrapper}>
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
                    nota,
                  );
                }}
                disabled={isSaving}
                listMode="MODAL"
                modalTitle={`Nota para ${q}`}
                modalAnimationType="slide"
                placeholder="0"
                style={styles.dropdownStyle}
                textStyle={styles.dropdownText}
                dropDownContainerStyle={styles.dropdownListStyle}
              />
            </View>
          </View>
        );
      }

      return ramos.map((r) => {
        const key = `${localItem ?? "single"}-${q}-${r}`;
        return (
          <View key={key} style={styles.inputRow}>
            <Text style={styles.inputLabel}>{r}</Text>
            <View style={styles.dropdownWrapper}>
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
                    nota,
                  );
                }}
                disabled={isSaving}
                listMode="MODAL"
                modalTitle={`Nota para ${q} - ${r}`}
                modalAnimationType="slide"
                placeholder="0"
                style={styles.dropdownStyle}
                textStyle={styles.dropdownText}
                dropDownContainerStyle={styles.dropdownListStyle}
              />
            </View>
          </View>
        );
      });
    };

    return (
      <View style={styles.cardContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>{orgao.nome}</Text>
          <Text style={styles.maxNotaBadge}>Max: {orgao.notaMax}</Text>
        </View>

        {locais.map((localItem: any, idx: number) => (
          <View key={localItem ?? idx} style={styles.locationContainer}>
            {localItem && (
              <View style={styles.localBadge}>
                <Text style={styles.localTitle}>{localItem}</Text>
              </View>
            )}

            <View style={styles.gridContainer}>
              {quadrantes.map((q) => (
                <View key={q} style={styles.quadranteBox}>
                  <Text style={styles.quadranteHeader}>{q}</Text>
                  {renderRamos(q, localItem)}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  },
);

export default OrgaoItem;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
  },
  maxNotaBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  locationContainer: {
    marginBottom: 10,
  },
  localBadge: {
    backgroundColor: "#e0f2fe",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  localTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0369a1",
  },

  gridContainer: {
    gap: 12,
  },
  quadranteBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fafafa",
  },
  quadranteHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 8,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },

  dropdownWrapper: {
    width: 90,
  },
  dropdownStyle: {
    minHeight: 36,
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 6,
    paddingHorizontal: 5,
  },
  dropdownText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "bold",
  },
  dropdownListStyle: {
    borderColor: "#cbd5e1",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  checkboxBase: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  checkmark: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
