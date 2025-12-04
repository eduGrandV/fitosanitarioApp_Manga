import * as FileSystem from "expo-file-system/legacy";
import * as MailComposer from "expo-mail-composer";
import * as Print from "expo-print";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { DoencaPraga, locaPlanta, Registro } from "../data/daodaAvaliacao";
import { Gps } from "./gps";

// Função auxiliar que busca os dados de um lote específico e os retorna.
const getDadosDoLote = async (lote: string): Promise<Registro[]> => {
  const chave = `@avaliacoes_${lote}`;
  const jsonDados = await AsyncStorage.getItem(chave);
  return jsonDados ? JSON.parse(jsonDados) : [];
};

export const gerarRelatorioDoLote = async (
  lote: string,
  doencasPragas: DoencaPraga[],
  nomeAvaliador?: string 
) => {
  try {
    const avaliacoesDoLote = await getDadosDoLote(lote);
    if (!avaliacoesDoLote || avaliacoesDoLote.length === 0) {
      Alert.alert("Sem dados", "Nenhuma avaliação encontrada para este lote.");
      return;
    }

    await gerarPDF(avaliacoesDoLote, doencasPragas, lote, undefined, nomeAvaliador);
  } catch (e) {
    console.error("Erro ao gerar relatório:", e);
    Alert.alert("Erro", "Não foi possível gerar o relatório.");
  }
};

export async function gerarPDF(
  avaliacoes: Registro[],
  doencasPragas: DoencaPraga[],
  lote: string,
  localSelecionadoNome?: string,
  nomeAvaliador?: string
) {
  if (avaliacoes.length === 0) {
    Alert.alert(
      "Nenhuma avaliação encontrada",
      "Por favor, registre algumas avaliações antes de gerar o relatório."
    );
    return;
  }

  const getWeekAtual = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const now = new Date();
  const dataBrasilia = now.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
  const semanaAtual = getWeekAtual(now);
  const plantasAvaliadas = [...new Set(avaliacoes.map((a) => a.planta))].sort(
    (a, b) => a - b
  );

  const plantasSaudaveis = plantasAvaliadas.filter((pl) =>
    avaliacoes.filter((a) => a.planta === pl).every((a) => (a.nota || 0) === 0)
  );

  const resumoDoencasLote = doencasPragas
    .map((item) => {
      const avalsItem = avaliacoes.filter((a) => a.doencaOuPraga === item.nome);

      let percentualFinal = 0;
      const loteNum = Number(lote);

      if (item.tipo === "doenca") {
        const orgaosAvaliados = [...new Set(avalsItem.map((a) => a.orgao))];
        const porcentagensDosOrgaos: number[] = [];

        orgaosAvaliados.forEach((orgaoNome) => {
          if (!orgaoNome) return;
          const registrosDoOrgao = avalsItem.filter(
            (r) => r.orgao === orgaoNome
          );
          const somaNotasOrgao = registrosDoOrgao.reduce(
            (s, a) => s + (a.nota || 0),
            0
          );

          const Folha = orgaoNome.toUpperCase().includes("FOLHA");
          const multiplicador = Folha ? 8 : 4;
          const maximoOrgao = multiplicador * loteNum;

          if (maximoOrgao > 0) {
            porcentagensDosOrgaos.push((somaNotasOrgao * 100) / maximoOrgao);
          }
        });

        if (porcentagensDosOrgaos.length > 0) {
          percentualFinal =
            porcentagensDosOrgaos.reduce((s, p) => s + p, 0) /
            porcentagensDosOrgaos.length;
        }
      } else if (item.tipo === "praga") {
        let totalBordadura = 0,
          totalAreaInterna = 0;
        avalsItem.forEach((a) => {
          if (a.identificadorDeLocal === "Bordadura")
            totalBordadura += a.nota || 0;
          else if (a.identificadorDeLocal === "Área interna da parcela")
            totalAreaInterna += a.nota || 0;
        });

        let maxBordadura = 4,
          maxAreaInterna = 6;
        if (loteNum === 14) {
          maxBordadura = 5;
          maxAreaInterna = 9;
        } else if (loteNum === 18) {
          maxBordadura = 6;
          maxAreaInterna = 12;
        }

        const temRamo = avalsItem.some((r) => !!r.ramo);
        const multiplicador = temRamo ? 8 : 4;
        const pB =
          maxBordadura * multiplicador > 0
            ? (totalBordadura * 100) / (maxBordadura * multiplicador)
            : 0;
        const pA =
          maxAreaInterna * multiplicador > 0
            ? (totalAreaInterna * 100) / (maxAreaInterna * multiplicador)
            : 0;
        percentualFinal = (pB + pA) / 2;
      }

      const style = percentualFinal >= 5 ? "color:red;font-weight:bold" : "";
      return `<li style="${style}">${item.nome}: ${percentualFinal.toFixed(
        2
      )}%</li>`;
    })
    .filter(Boolean)
    .join("");

  // --- INÍCIO DA CONSTRUÇÃO DO HTML ---
  let html = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 25px; color: #111827; }
        header { text-align: center; margin-bottom: 20px; }
        header img { width: 180px; }
        h1 { page-break-after: avoid; text-align: center; color: #059669; margin-top: 10px; font-size: 22px; }
        h2 { page-break-after: avoid; margin-top: 25px; padding: 10px; background-color: #f3f4f6; border-left: 5px solid #10b981; color: #111827; border-radius: 6px; font-size: 16px;}
        h3 { font-size: 14px; margin-top: 20px; color: #1f2937; }
        h3.doenca { color: #065f46; }
        h3.praga { color: #c2410c; }
        table { border-collapse: collapse; width: 100%; margin-top: 15px; page-break-inside: avoid }
        th, td { border: 1px solid #d1d5db; padding: 7px; text-align: center; font-size: 10px; word-break: break-word; }
        th { background-color: #047857; color: #ffffff; }
        tr:nth-child(even) { background-color: #f9fafb; }
        tr.bold-total { font-weight: bold; background: #dcfce7; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #6b7280; }
        p, li { line-height: 1.6; font-size: 12px; }
        ul { padding-left: 20px; }
      </style>
    </head>
    <body>
      <header><img src="https://grandvalle.com.br/wp-content/uploads/2023/12/GrandValle-1.png" alt="Logo" /></header>
      <h1>Relatório de Avaliações - QTDA, Planta ${lote}</h1>
      <h1>Avaliações Realizado -  ${nomeAvaliador}</h1>

      <p style="text-align:center; font-size: 11px;">Gerado em ${dataBrasilia} - Semana: ${semanaAtual}</p>
      
      <h2>📝 Resumo Geral do Lote</h2>
      <p>Das <strong>${
        plantasAvaliadas.length
      }</strong> plantas avaliadas, <strong>${
    plantasAvaliadas.length - -(-Number(lote))
  }</strong> estão completamente saudáveis.</p>
      <h3>Indicadores Gerais de Doenças/Pragas no Lote:</h3>
      <ul>${resumoDoencasLote}</ul>
      <hr/>
  `;

  for (const planta of plantasAvaliadas) {
    const avaliacoesDaPlanta = avaliacoes.filter((r) => r.planta === planta);

    // 1. PRIMEIRO, agrupa todas as avaliações desta planta por Centro de Custo
    const avaliacoesPorCC: Record<string, Registro[]> =
      avaliacoesDaPlanta.reduce((acc, avaliacao) => {
        const cc = avaliacao.centroCusto || "N/A";
        if (!acc[cc]) {
          acc[cc] = [];
        }
        acc[cc].push(avaliacao);
        return acc;
      }, {} as Record<string, Registro[]>);

    // 2. DEPOIS, itera sobre cada grupo de Centro de Custo
    for (const centroCusto in avaliacoesPorCC) {
      const avaliacoesDoCC = avaliacoesPorCC[centroCusto];
      const localInfo = locaPlanta.find((l) => l.centroCusto === centroCusto);
      const nomeDoLocal = localInfo ? localInfo.name : centroCusto;

      // Adiciona um sub-cabeçalho para o Centro de Custo, deixando a seção clara
      html += `<h3 style="background-color: #f3f4f6; padding: 8px; border-radius: 4px; margin-top: 20px; border-left: 4px solid #9ca3af;">Local: ${nomeDoLocal} (CC: ${centroCusto})</h3>`;

      const itensAvaliadosNoCC = [
        ...new Set(avaliacoesDoCC.map((a) => a.doencaOuPraga)),
      ];

      for (const nomeItem of itensAvaliadosNoCC) {
        const itemSelecionado = doencasPragas.find((d) => d.nome === nomeItem);
        if (!itemSelecionado) continue;
        html += `<h2>🌱 Relatório - ${itemSelecionado.nome} </h2>`;

        html += `<h4 class="${itemSelecionado.tipo}" style="margin-left: 10px; font-size: 13px; font-weight: bold;">${itemSelecionado.nome}</h4>
            <table>
                <thead>
                    <tr>
                        <th>Órgão / Item</th>
                        <th>Local (Q/R)</th>
                        <th>Notas</th>
                        <th>Total</th>
                        <th>%</th>
                    </tr>
                </thead>
                <tbody>
            `;

        for (const o of itemSelecionado.orgaos) {
          // Agora, filtramos dentro do grupo do CC, garantindo a separação correta
          const registrosDoOrgao = avaliacoesDoCC.filter(
            (r) => r.orgao === o.nome && r.doencaOuPraga === nomeItem
          );
          if (registrosDoOrgao.length === 0) continue;

          // O restante da sua lógica para criar as linhas da tabela (doença, praga, etc.)
          // continua aqui, pois agora opera sobre os dados já separados por CC.
          if (itemSelecionado.nome === "INIMIGOS NATURAIS") {
            const registro = registrosDoOrgao[0];
            const status =
              (registro.nota || 0) > 0 ? "✅ Presente" : "❌ Ausente";
            const localInfoTxt = `Q:${registro.quadrante || "-"}`;
            html += `<tr><td>${o.nome}</td><td>${localInfoTxt}</td><td colspan="3">${status}</td></tr>`;
          } else if (itemSelecionado.tipo === "doenca") {
            const notasDoOrgao = registrosDoOrgao.map((r) => r.nota);
            const locaisDoOrgao = registrosDoOrgao
              .map((r) => `${r.quadrante || ""}${r.ramo ? "/" + r.ramo : ""}`)
              .join("; ");
            const totalNotas = notasDoOrgao.reduce(
              (acc: number, nota) => acc + (nota || 0),
              0
            );
            const maxPorOrgao = o.nome.toUpperCase().includes("FOLHA")
              ? 8 * Number(lote)
              : 4 * Number(lote);
            const porcentagem =
              maxPorOrgao > 0 ? (totalNotas * 100) / maxPorOrgao : 0;
            html += `<tr><td>${
              o.nome
            }</td><td>${locaisDoOrgao}</td><td>${notasDoOrgao.join(
              ", "
            )}</td><td>${totalNotas}</td><td>${porcentagem.toFixed(
              2
            )}%</td></tr>`;
          } else {
            // PRAGA
            const bordaduraRegistros = registrosDoOrgao.filter(
              (r) => r.identificadorDeLocal === "Bordadura"
            );
            const areaInternaRegistros = registrosDoOrgao.filter(
              (r) => r.identificadorDeLocal === "Área interna da parcela"
            );
            let mediaPorcentagem = 0;

            if (bordaduraRegistros.length > 0) {
              const totalBordadura = bordaduraRegistros.reduce(
                (acc, n) => acc + (n.nota || 0),
                0
              );
              const locaisBordadura = bordaduraRegistros
                .map((r) => `${r.quadrante || ""}${r.ramo ? "/" + r.ramo : ""}`)
                .join("; ");
              let maxBordadura = 4;
              if (Number(lote) === 14) {
                maxBordadura = 5;
              } else if (Number(lote) === 18) {
                maxBordadura = 6;
              }
              const temRamo = bordaduraRegistros.some((r) => !!r.ramo);
              const multiplicadorAmostra = temRamo ? 8 : 4;
              const porcentagemBordadura =
                maxBordadura * multiplicadorAmostra > 0
                  ? (totalBordadura * 100) /
                    (maxBordadura * multiplicadorAmostra)
                  : 0;
              mediaPorcentagem += porcentagemBordadura;
              html += `<tr><td>${
                o.nome
              } (Bordadura)</td><td>${locaisBordadura}</td><td>${bordaduraRegistros
                .map((r) => r.nota)
                .join(
                  ", "
                )}</td><td>${totalBordadura}</td><td>${porcentagemBordadura.toFixed(
                2
              )}%</td></tr>`;
            }
            if (areaInternaRegistros.length > 0) {
              const totalAreaInterna = areaInternaRegistros.reduce(
                (acc, n) => acc + (n.nota || 0),
                0
              );
              const locaisAreaInterna = areaInternaRegistros
                .map((r) => `${r.quadrante || ""}${r.ramo ? "/" + r.ramo : ""}`)
                .join("; ");
              let maxAreaInterna = 6;
              if (Number(lote) === 14) {
                maxAreaInterna = 9;
              } else if (Number(lote) === 18) {
                maxAreaInterna = 12;
              }
              const temRamo = areaInternaRegistros.some((r) => !!r.ramo);
              const multiplicadorAmostra = temRamo ? 8 : 4;
              const porcentagemAreaInterna =
                maxAreaInterna * multiplicadorAmostra > 0
                  ? (totalAreaInterna * 100) /
                    (maxAreaInterna * multiplicadorAmostra)
                  : 0;
              mediaPorcentagem += porcentagemAreaInterna;
              html += `<tr><td>${
                o.nome
              } (Área interna)</td><td>${locaisAreaInterna}</td><td>${areaInternaRegistros
                .map((r) => r.nota)
                .join(
                  ", "
                )}</td><td>${totalAreaInterna}</td><td>${porcentagemAreaInterna.toFixed(
                2
              )}%</td></tr>`;
            }

            const divisorMedia =
              bordaduraRegistros.length > 0 && areaInternaRegistros.length > 0
                ? 2
                : 1;
            mediaPorcentagem /= divisorMedia;

            if (
              bordaduraRegistros.length > 0 ||
              areaInternaRegistros.length > 0
            ) {
              html += `<tr class="bold-total"><td colspan="4">Média Total ${
                o.nome
              }</td><td>${mediaPorcentagem.toFixed(2)}%</td></tr>`;
            }
          }
        }
        html += `</tbody></table>`;
      }
    }
  }

  const coords = await Gps();
  html += `<p><strong>📍 Localização do Envio da avaliação:</strong><br/>
    Latitude: ${coords?.latitude || "não disponível"}<br/>
    Longitude: ${coords?.longitude || "não disponível"}<br/>
    Altitude: ${coords?.altitude || "não disponível"} m<br/>
    Precisão: ${coords?.accuracy || "-"} m<br/>
    Data/Hora: ${coords ? new Date(coords.timestamp).toLocaleString() : "-"}
  </p>`;
  html += `
    <hr style="margin-top:40px; border:1px solid #111827;">
    <br/><br/>
    <div style="margin-top: 60px; display:flex; justify-content: space-between;">
      <div style="width:45%; text-align:center;"><p>____________________________________</p><p>Assinatura</p></div>
      <div style="width:45%; text-align:center;"><p>____________________________________</p><p>Carimbo</p></div>
    </div>
    <div class="footer">Relatório gerado automaticamente pelo app GrandValle 🌿</div>
    </body></html>`;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    const fileName = `Relatorio_QtdaPlantas_${lote}_${
      now.toISOString().split("T")[0]
    }.pdf`;
    const newPath = FileSystem.documentDirectory + fileName;
    await FileSystem.moveAsync({ from: uri, to: newPath });

    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        "Não é possível enviar emails deste dispositivo.",
        "Tente novamente."
      );
      return;
    }

    await MailComposer.composeAsync({
      recipients: ["wagner@grandvalle.com", "mangagv@grandvalle.com"],
      subject: `Relatório de Avaliações - QTDA ${lote}`,
      body: `Segue em anexo o relatório de avaliações para o Lote ${lote}.`,
      isHtml: true,
      attachments: [newPath],
    });

    Alert.alert("O PDF foi gerado e enviado para o email.");
  } catch (error) {
    console.error(error);
    Alert.alert("Erro Inesperado", "Não foi possível gerar ou enviar o PDF.");
  }
}
