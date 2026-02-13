import { useMemo } from "react";
import { doencasPragas, ItemResumo, Registro } from "../../data/daodaAvaliacao";

export const useResumoPlanta = (
  avaliacoes: Registro[],
  plantaSelecionada: number,
  lote: string,
  centroCustoSelecionado: string,
  qtdePlantas: number,
) => {
  const resumoDaPlanta = useMemo(() => {
    const calcularResumoPlanta = (
      plantaNumero: number,
      cc: string,
    ): ItemResumo[] => {
      return doencasPragas.map((item) => {
        const registrosItem = avaliacoes.filter(
          (a) =>
            a.planta === plantaNumero &&
            a.doencaOuPraga === item.nome &&
            a.centroCusto === cc,
        );

        const orgaos = item.orgaos.map((o) => {
          const registrosOrgao = registrosItem.filter(
            (r) => r.orgao === o.nome,
          );
          let totalNotas = 0;

          if (item.tipo === "doenca") {
            const notasUnicas: Record<string, number> = {};

            registrosOrgao.forEach((r) => {
              const key = `${r.quadrante || "SemQ"}-${r.ramo || "SemR"}-${
                r.identificadorDeLocal || "SemL"
              }-${r.numeroLocal || "SemN"}`;
              notasUnicas[key] = r.nota ?? 0;
            });

            totalNotas = Object.values(notasUnicas).reduce((s, n) => s + n, 0);
          }

          if (item.tipo === "doenca") {
            const isFolha = o.nome.toUpperCase().includes("FOLHA");
            // Usa qtdePlantas para calcular o máximo
            const maxPorOrgao = (isFolha ? 8 : 4) * qtdePlantas;
            const porcentagem =
              maxPorOrgao > 0 ? (totalNotas * 100) / maxPorOrgao : 0;
            return {
              nome: o.nome,
              tipo: item.tipo,
              totalNotas,
              porcentagem,
            };
          } else {
            const bordaduraNotas = registrosOrgao
              .filter((r) => r.identificadorDeLocal === "Bordadura")
              .map(() => 1);

            const areaNotas = registrosOrgao
              .filter(
                (r) => r.identificadorDeLocal === "Área interna da parcela",
              )
              .map(() => 1);

            const totalBordadura = bordaduraNotas.reduce((s, n) => s + n, 0);
            const totalArea = areaNotas.reduce((s, n) => s + n, 0);

            let maxBordadura = 4,
              maxArea = 6;
            if (qtdePlantas === 14) {
              maxBordadura = 5;
              maxArea = 9;
            } else if (qtdePlantas === 18) {
              maxBordadura = 6;
              maxArea = 12;
            }

            const temRamo = registrosOrgao.some((r) => !!r.ramo);
            const multiplicador = temRamo ? 8 : 4;
            const pctB =
              maxBordadura * multiplicador > 0
                ? (totalBordadura * 100) / (maxBordadura * multiplicador)
                : 0;
            const pctA =
              maxArea * multiplicador > 0
                ? (totalArea * 100) / (maxArea * multiplicador)
                : 0;
            const media = (pctB + pctA) / 2;
            return {
              nome: o.nome,
              tipo: item.tipo,
              totalBordadura,
              totalArea,
              porcentagemBordadura: pctB,
              porcentagemArea: pctA,
              porcentagemMedia: media,
              temRamo,
            };
          }
        });

        let somaNotas = 0,
          somaMax = 0;
        item.orgaos.forEach((o) => {
          const resumoOrgao = orgaos.find((x) => x.nome === o.nome);
          if (!resumoOrgao) return;
          if (item.tipo === "doenca") {
            const isFolha = o.nome.toUpperCase().includes("FOLHA");
            const max = (isFolha ? 8 : 4) * qtdePlantas; // Usa qtdePlantas
            somaMax += max;
            somaNotas += (resumoOrgao as any).totalNotas ?? 0;
          } else {
            // Lógica de Pragas
            const maxB = qtdePlantas === 14 ? 5 : qtdePlantas === 18 ? 6 : 4;
            const maxA = qtdePlantas === 14 ? 9 : qtdePlantas === 18 ? 12 : 6;
            const temRamo = (resumoOrgao as any).temRamo ? 8 : 4;
            somaMax += (maxB + maxA) * temRamo;
            somaNotas +=
              ((resumoOrgao as any).totalBordadura ?? 0) +
              ((resumoOrgao as any).totalArea ?? 0);
          }
        });
        const percentualComposto =
          somaMax > 0 ? (somaNotas * 100) / somaMax : 0;
        return { nome: item.nome, tipo: item.tipo, orgaos, percentualComposto };
      });
    };

    if (!avaliacoes || avaliacoes.length === 0 || !centroCustoSelecionado)
      return [];
    return calcularResumoPlanta(plantaSelecionada, centroCustoSelecionado);
  }, [
    avaliacoes,
    plantaSelecionada,
    lote,
    centroCustoSelecionado,
    qtdePlantas,
  ]); // qtdePlantas na dependência

  return resumoDaPlanta;
};
