import * as FileSystem from "expo-file-system/legacy";
import * as MailComposer from "expo-mail-composer";
import * as Print from "expo-print";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DoencaPraga, locaPlanta, Registro } from "../data/daodaAvaliacao";
import { Gps } from "../components/gps";

const getDadosDoLote = async (loteAlvo: string): Promise<Registro[]> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();

    const keysPacotes = allKeys.filter((key) => key.startsWith("@pacote_"));

    let todasAvaliacoes: Registro[] = [];

    for (const key of keysPacotes) {
      const json = await AsyncStorage.getItem(key);
      if (json) {
        const pacote = JSON.parse(json);

        if (String(pacote.header.lote) === String(loteAlvo)) {
          todasAvaliacoes = [...todasAvaliacoes, ...pacote.avaliacoes];
        }
      }
    }

    return todasAvaliacoes;
  } catch (error) {
    console.error("Erro ao buscar dados dos pacotes:", error);
    return [];
  }
};

export const gerarRelatorioDoLote = async (
  lote: string,
  doencasPragas: DoencaPraga[],
  nomeAvaliador: string = "Não informado",
) => {
  try {
    const avaliacoesDoLote = await getDadosDoLote(lote);

    if (!avaliacoesDoLote || avaliacoesDoLote.length === 0) {
      Alert.alert(
        "Sem dados",
        `Nenhuma avaliação encontrada para o Lote ${lote} no dispositivo. Se você já sincronizou, os dados saíram do celular.`,
      );
      return;
    }

    await gerarPDF(
      avaliacoesDoLote,
      doencasPragas,
      lote,
      undefined,
      nomeAvaliador,
    );
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
  nomeAvaliador?: string,
) {
  if (avaliacoes.length === 0) {
    Alert.alert("Aviso", "Não há dados para gerar o PDF.");
    return;
  }

  // --- LÓGICA DE DATAS ---
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
    (a, b) => a - b,
  );

  const resumoDoencasLote = doencasPragas
    .map((item) => {
      const avalsItem = avaliacoes.filter((a) => a.doencaOuPraga === item.nome);
      let percentualFinal = 0;
      const loteNum = Number(lote);

      // Lógica de Doença
      if (item.tipo === "doenca") {
        const orgaosAvaliados = [...new Set(avalsItem.map((a) => a.orgao))];
        const porcentagensDosOrgaos: number[] = [];

        orgaosAvaliados.forEach((orgaoNome) => {
          if (!orgaoNome) return;
          const registrosDoOrgao = avalsItem.filter(
            (r) => r.orgao === orgaoNome,
          );
          const somaNotasOrgao = registrosDoOrgao.reduce(
            (s, a) => s + (a.nota || 0),
            0,
          );

          const Folha = orgaoNome.toUpperCase().includes("FOLHA");
          const multiplicador = Folha ? 8 : 4;
          const maximoOrgao = multiplicador * loteNum; // Aqui vc usa loteNum, mas verifique se não deveria ser qtde de plantas * mult

          if (maximoOrgao > 0) {
            porcentagensDosOrgaos.push((somaNotasOrgao * 100) / maximoOrgao);
          }
        });

        if (porcentagensDosOrgaos.length > 0) {
          percentualFinal =
            porcentagensDosOrgaos.reduce((s, p) => s + p, 0) /
            porcentagensDosOrgaos.length;
        }

        // Lógica de Praga
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

      const style =
        percentualFinal >= 5 ? "color:#ef4444;font-weight:bold" : "";
      return percentualFinal > 0
        ? `<li style="${style}">${item.nome}: ${percentualFinal.toFixed(2)}%</li>`
        : "";
    })
    .filter(Boolean)
    .join("");

  let html = `
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 20px; color: #1f2937; }
        header { text-align: center; margin-bottom: 20px; }
        header img { width: 150px; }
        h1 { text-align: center; color: #047857; margin-top: 5px; font-size: 20px; }
        h2 { background-color: #f3f4f6; padding: 8px; border-left: 5px solid #10b981; color: #111827; border-radius: 4px; font-size: 16px; margin-top: 25px; page-break-after: avoid; }
        h3 { font-size: 14px; margin-top: 15px; color: #374151; page-break-after: avoid; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 11px; page-break-inside: avoid; }
        th, td { border: 1px solid #e5e7eb; padding: 6px; text-align: center; }
        th { background-color: #059669; color: #ffffff; font-weight: 600; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .bold-total { font-weight: bold; background: #d1fae5 !important; }
        .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #9ca3af; }
        ul { padding-left: 20px; font-size: 12px; }
        li { margin-bottom: 4px; }
      </style>
    </head>
    <body>
      <header>
        <img src="https://grandvalle.com.br/wp-content/uploads/2023/12/GrandValle-1.png" alt="GrandValle" />
      </header>
      <h1>Relatório QTDA - Lote ${lote}</h1>
      <p style="text-align:center; font-size: 11px; color: #6b7280;">
        Avaliador: <strong>${nomeAvaliador || "N/A"}</strong> | Data: ${dataBrasilia} | Semana: ${semanaAtual}
      </p>
      
      <h2>📊 Resumo Geral</h2>
      <p style="font-size: 12px;">Plantas Avaliadas: <strong>${plantasAvaliadas.length}</strong></p>
      
      ${resumoDoencasLote ? `<h3>⚠️ Ocorrências Identificadas:</h3><ul>${resumoDoencasLote}</ul>` : "<p>✅ Nenhuma praga ou doença detectada.</p>"}
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  `;

  for (const planta of plantasAvaliadas) {
    const avaliacoesDaPlanta = avaliacoes.filter((r) => r.planta === planta);

    const avaliacoesPorCC = avaliacoesDaPlanta.reduce(
      (acc, avaliacao) => {
        const cc = avaliacao.centroCusto || "N/A";
        if (!acc[cc]) acc[cc] = [];
        acc[cc].push(avaliacao);
        return acc;
      },
      {} as Record<string, Registro[]>,
    );

    for (const centroCusto in avaliacoesPorCC) {
      const avaliacoesDoCC = avaliacoesPorCC[centroCusto];
      const localInfo = locaPlanta.find((l) => l.centroCusto === centroCusto);
      const nomeDoLocal = localInfo ? localInfo.name : `Planta ${planta}`;

      html += `<h3 style="background-color: #e5e7eb; padding: 5px; border-radius: 4px;">📍 ${nomeDoLocal} (CC: ${centroCusto})</h3>`;

      const itensAvaliadosNoCC = [
        ...new Set(avaliacoesDoCC.map((a) => a.doencaOuPraga)),
      ];

      for (const nomeItem of itensAvaliadosNoCC) {
        const itemSelecionado = doencasPragas.find((d) => d.nome === nomeItem);
        if (!itemSelecionado) continue;

        html += `
           <div style="margin-left: 10px; margin-bottom: 15px;">
             <strong style="color: ${itemSelecionado.tipo === "praga" ? "#c2410c" : "#047857"}">${itemSelecionado.nome}</strong>
             <table>
                <thead>
                    <tr>
                        <th width="25%">Órgão</th>
                        <th width="25%">Local</th>
                        <th width="20%">Notas</th>
                        <th width="15%">Total</th>
                        <th width="15%">%</th>
                    </tr>
                </thead>
                <tbody>
            `;

        for (const o of itemSelecionado.orgaos) {
          const registrosDoOrgao = avaliacoesDoCC.filter(
            (r) => r.orgao === o.nome && r.doencaOuPraga === nomeItem,
          );
          if (registrosDoOrgao.length === 0) continue;

          if (itemSelecionado.nome === "INIMIGOS NATURAIS") {
            const registro = registrosDoOrgao[0];
            const status =
              (registro.nota || 0) > 0 ? "✅ Presente" : "⚪ Ausente";
            html += `<tr><td>${o.nome}</td><td>Q:${registro.quadrante || "-"}</td><td colspan="3">${status}</td></tr>`;
          } else if (itemSelecionado.tipo === "doenca") {
            const notas = registrosDoOrgao.map((r) => r.nota || 0);
            const totalNotas = notas.reduce((a, b) => a + b, 0);

            const locais = registrosDoOrgao
              .map((r) => `${r.quadrante || ""}${r.ramo ? "/" + r.ramo : ""}`)
              .join(" ");

            const maxPorOrgao = o.nome.toUpperCase().includes("FOLHA")
              ? 8 * Number(lote)
              : 4 * Number(lote);
            const porcentagem =
              maxPorOrgao > 0 ? (totalNotas * 100) / maxPorOrgao : 0;

            html += `<tr>
                <td>${o.nome}</td>
                <td>${locais}</td>
                <td>${notas.join(", ")}</td>
                <td>${totalNotas}</td>
                <td>${porcentagem.toFixed(2)}%</td>
            </tr>`;

            // -- PRAGAS --
          } else {
            const processarLocal = (tipo: string) => {
              const regs = registrosDoOrgao.filter(
                (r) => r.identificadorDeLocal === tipo,
              );
              if (regs.length === 0) return "";

              const total = regs.reduce((acc, n) => acc + (n.nota || 0), 0);
              const locais = regs
                .map((r) => `${r.quadrante}${r.ramo ? "/" + r.ramo : ""}`)
                .join(" ");

              let max =
                Number(lote) === 14
                  ? tipo === "Bordadura"
                    ? 5
                    : 9
                  : Number(lote) === 18
                    ? tipo === "Bordadura"
                      ? 6
                      : 12
                    : tipo === "Bordadura"
                      ? 4
                      : 6;
              const temRamo = regs.some((r) => !!r.ramo);
              const mult = temRamo ? 8 : 4;
              const pct = max * mult > 0 ? (total * 100) / (max * mult) : 0;

              return `<tr>
                  <td>${o.nome} <br/><span style="font-size:8px; color:#666">(${tipo})</span></td>
                  <td>${locais}</td>
                  <td>${regs.map((r) => r.nota).join(", ")}</td>
                  <td>${total}</td>
                  <td>${pct.toFixed(2)}%</td>
                </tr>`;
            };

            html += processarLocal("Bordadura");
            html += processarLocal("Área interna da parcela");
          }
        }
        html += `</tbody></table></div>`;
      }
    }
  }

  let gpsHtml = "<p>Sem dados de GPS.</p>";
  try {
    const coords = await Gps();
    if (coords) {
      gpsHtml = `<p style="font-size: 10px; background: #f9fafb; padding: 10px; border: 1px dashed #ccc;">
          <strong>📍 Localização da Geração:</strong><br/>
          Lat: ${coords.latitude} | Long: ${coords.longitude}<br/>
          Alt: ${coords.altitude?.toFixed(2) || 0}m | Prec: ${coords.accuracy?.toFixed(2) || 0}m<br/>
          Data: ${new Date(coords.timestamp || Date.now()).toLocaleString()}
        </p>`;
    }
  } catch (err) {
    console.log("Erro ao pegar GPS no PDF", err);
  }

  html += `
    <div style="margin-top: 30px; page-break-inside: avoid;">
      ${gpsHtml}
      <br/><br/>
      <div style="display:flex; justify-content: space-between; margin-top: 40px;">
        <div style="width:40%; border-top: 1px solid #000; text-align:center; font-size: 10px; padding-top: 5px;">Assinatura do Avaliador</div>
        <div style="width:40%; border-top: 1px solid #000; text-align:center; font-size: 10px; padding-top: 5px;">Visto do Gerente</div>
      </div>
      <div class="footer">GrandValle - Relatório Automático v2.0</div>
    </div>
    </body></html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });

    const cleanLote = lote.replace(/[^a-zA-Z0-9]/g, "");
    const fileName = `Relatorio_Lote${cleanLote}_${now.toISOString().split("T")[0]}.pdf`;

    const newPath = FileSystem.documentDirectory + fileName;
    await FileSystem.moveAsync({ from: uri, to: newPath });

    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("Erro", "Email não configurado neste dispositivo.");
      return;
    }

    await MailComposer.composeAsync({
      //"wagner@grandvalle.com", "mangagv@grandvalle.com"
      recipients: ["flavimar@grandvalle.com"],
      subject: `Relatório QTDA - Lote ${lote}`,
      body: `Segue em anexo o relatório de avaliação do Lote ${lote}.\n\nAvaliador: ${nomeAvaliador}`,
      isHtml: false,
      attachments: [newPath],
    });

    Alert.alert(
      "Sucesso",
      "Relatório gerado e enviado para o rascunho de email.",
    );
  } catch (error) {
    console.error("Erro final PDF:", error);
    Alert.alert("Erro", "Falha na criação do PDF.");
  }
}
