import { useMemo } from "react";
import { doencasPragas, Registro } from "../../data/daodaAvaliacao";

// --- 1. HOOK DA PLANTA (Resumo Individual no Tablet) ---
export const useResumoPlanta = (
  avaliacoes: Registro[],
  plantaSelecionada: number,
  _lote: string,
  centroCustoSelecionado: string,
  qtdePlantas: number,
) => {
  return useMemo(() => {
    if (!avaliacoes || avaliacoes.length === 0 || !centroCustoSelecionado) return [];

    return doencasPragas.map((item) => {
      const registrosItem = avaliacoes.filter(
        (a) => a.planta === plantaSelecionada && a.doencaOuPraga === item.nome && a.centroCusto === centroCustoSelecionado
      );

      const orgaos = item.orgaos.map((o) => {
        const registrosOrgao = registrosItem.filter((r) => r.orgao === o.nome);

        if (item.tipo === "doenca") {
          // 🚀 DOENÇAS NA PLANTA: Calculando a porcentagem já diluída pelo lote inteiro
          const somaNotas = registrosOrgao.reduce((s, r) => s + (Number(r.nota) || 0), 0);

          // 8 partes para Folha/Ramo, 4 para os restantes
          const mult = o.nome.toUpperCase().includes("FOLHA") || o.nome.toUpperCase().includes("RAMO") ? 8 : 4;

          // A mágica: (mult * qtdePlantas) garante que a soma 7 dê 8.75% em vez de 87.5%
          const divisorPlanta = mult * qtdePlantas;

          const porcentagem = divisorPlanta > 0 ? (somaNotas * 100) / divisorPlanta : 0;

          return { nome: o.nome, tipo: item.tipo, totalNotas: somaNotas, porcentagem };
        } else {
          // 🐛 PRAGAS NA PLANTA
          let totalB = 0, totalA = 0;
          registrosOrgao.forEach(r => {
            if (r.identificadorDeLocal === "Bordadura" || r.local === "Bordadura") totalB += (Number(r.nota) || 0);
            else totalA += (Number(r.nota) || 0);
          });

          // Inteligência de tamanho do lote para a bordadura e área
          let maxB = 4, maxA = 6;
          if (qtdePlantas === 14) { maxB = 5; maxA = 9; }
          else if (qtdePlantas === 18) { maxB = 6; maxA = 12; }

          const notaMaxOrgao = o.notaMax || 1;
          const temRamo = registrosOrgao.some((r) => !!r.ramo);
          const mult = temRamo ? 8 : 4;

          const dB = maxB * mult * notaMaxOrgao;
          const dA = maxA * mult * notaMaxOrgao;

          const pB = dB > 0 ? (totalB * 100) / dB : 0;
          const pA = dA > 0 ? (totalA * 100) / dA : 0;
          const media = (pB + pA) / 2;

          return {
            nome: o.nome,
            tipo: item.tipo,
            totalBordadura: totalB,
            totalArea: totalA,
            porcentagemBordadura: pB,
            porcentagemArea: pA,
            porcentagemMedia: media,
          };
        }
      });

      // Calcula percentual composto
      const orgaosValidos = orgaos.filter(o => {
        const p = (o as any).porcentagemMedia !== undefined ? (o as any).porcentagemMedia : (o as any).porcentagem;
        return p > 0;
      });

      const somaP = orgaosValidos.reduce((acc, o) => {
        const p = (o as any).porcentagemMedia !== undefined ? (o as any).porcentagemMedia : (o as any).porcentagem;
        return acc + p;
      }, 0);

      const mediaFinal = orgaosValidos.length > 0 ? (somaP / orgaosValidos.length) : 0;
      const percentualComposto = Math.min(mediaFinal, 100);

      return {
        nome: item.nome,
        tipo: item.tipo,
        orgaos,
        percentualComposto: parseFloat(percentualComposto.toFixed(2)),
      };
    });
  }, [avaliacoes, plantaSelecionada, centroCustoSelecionado, qtdePlantas]);
};

// --- 2. HOOK DO LOTE (Resumo da Fazenda / PDF / Site) ---
export const useResumoLote = (
  avaliacoes: Registro[],
  _plantaSelecionada: number,
  _lote: string,
  centroCustoSelecionado: string,
  qtdePlantas: number,
) => {
  return useMemo(() => {
    if (!avaliacoes || avaliacoes.length === 0 || !centroCustoSelecionado) return [];

    return doencasPragas.map((item) => {
      const avalsItem = avaliacoes.filter(
        (a) => a.doencaOuPraga === item.nome && a.centroCusto === centroCustoSelecionado
      );

      let percentualFinal = 0;

      if (item.tipo === "doenca") {
        // 🚀 DOENÇAS NO LOTE: O papel da Embrapa é a lei (Plantas x Partes)
        let somaTotalNotas = 0;
        let divisorTotalLote = 0;
        const orgaosAvaliados = [...new Set(avalsItem.map((a) => a.orgao))];

        orgaosAvaliados.forEach((orgaoNome) => {
          if (!orgaoNome) return;
          const registrosDoOrgao = avalsItem.filter((r) => r.orgao === orgaoNome);
          const soma = registrosDoOrgao.reduce((s, a) => s + (Number(a.nota) || 0), 0);

          // Define partes por planta: 8 para folhas/ramos, 4 para vegetativa/frutos
          const mult = orgaoNome.toUpperCase().includes("FOLHA") || orgaoNome.toUpperCase().includes("RAMO") ? 8 : 4;

          somaTotalNotas += soma;
          divisorTotalLote += (mult * qtdePlantas);
        });

        // Exemplo Lote 10: Soma 7 -> (7 * 100) / 80 = 8.75%
        // Exemplo Lote 14: Soma 7 -> (7 * 100) / 112 = 6.25%
        percentualFinal = divisorTotalLote > 0 ? (somaTotalNotas * 100) / divisorTotalLote : 0;

      } else {
        // 🐛 PRAGAS NO LOTE: Bordadura vs Área Interna com lotes dinâmicos
        const porcentagensDosOrgaos: number[] = [];
        let maxB = 4, maxA = 6;
        if (qtdePlantas === 14) { maxB = 5; maxA = 9; }
        else if (qtdePlantas === 18) { maxB = 6; maxA = 12; }

        item.orgaos.forEach((orgao) => {
          const registrosDoOrgao = avalsItem.filter((r) => r.orgao === orgao.nome);
          if (registrosDoOrgao.length === 0) return;

          const notaMaxOrgao = orgao.notaMax || 1;
          const temRamo = registrosDoOrgao.some(r => !!r.ramo);
          const mult = temRamo ? 8 : 4;

          let totalB = 0, totalA = 0;
          registrosDoOrgao.forEach(r => {
            // Filtro abrangente anti-falha
            if (r.identificadorDeLocal === "Bordadura" || r.local === "Bordadura") {
              totalB += (Number(r.nota) || 0);
            } else {
              totalA += (Number(r.nota) || 0);
            }
          });

          const divisorB = maxB * mult * notaMaxOrgao;
          const divisorA = maxA * mult * notaMaxOrgao;

          const pB = divisorB > 0 ? (totalB * 100) / divisorB : 0;
          const pA = divisorA > 0 ? (totalA * 100) / divisorA : 0;
          porcentagensDosOrgaos.push((pB + pA) / 2);
        });

        if (porcentagensDosOrgaos.length > 0) {
          percentualFinal = porcentagensDosOrgaos.reduce((s, p) => s + p, 0) / porcentagensDosOrgaos.length;
        }
      }

      // Limite cravado em 100% (Sem o erro do '/ 10' no final)
      percentualFinal = Math.min(percentualFinal, 100);

      return {
        nome: item.nome,
        percentualFinal: parseFloat(percentualFinal.toFixed(2))
      };
    });
  }, [avaliacoes, centroCustoSelecionado, qtdePlantas]);
};