import * as Location from "expo-location";
import { Alert } from "react-native";
import { PontoLocalizacao } from "../data/daodaAvaliacao";

export const localizacaoPadrao = {
  latitude: -9.287495,
  longitude: -40.878419,
};

const criarPontoLocalizacao = (
  lote: string,
  {
    latitude,
    longitude,
    accuracy,
  }: { latitude: number; longitude: number; accuracy?: number },
): PontoLocalizacao => ({
  id: Date.now(),
  lote,
  latitude,
  longitude,
  accuracy: accuracy ?? 0,
  timestamp: Date.now(),
});

export async function Gps() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permissão de Localização negada!");
    return null;
  }

  const loc = await Location.getCurrentPositionAsync({});
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    altitude: loc.coords.altitude,
    accuracy: loc.coords.accuracy,
    altitudeAccuracy: loc.coords.altitudeAccuracy,
    heading: loc.coords.heading,
    speed: loc.coords.speed,
    timestamp: loc.timestamp,
  };
}

export const obterLocalizacaoComTime = async (
  lote: string,
  timeoutMs = 5000,
): Promise<PontoLocalizacao> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn(
        "Permissão de localização negada, usando coordenadas padrão.",
      );
      return criarPontoLocalizacao(lote, {
        ...localizacaoPadrao,
        accuracy: 999,
      });
    }

    const posicaoPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      mayShowUserSettingsDialog: false,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Timeout ao buscar localização")),
        timeoutMs,
      ),
    );

    const posicao: any = await Promise.race([posicaoPromise, timeoutPromise]);

    return criarPontoLocalizacao(lote, {
      latitude: posicao.coords.latitude,
      longitude: posicao.coords.longitude,
      accuracy: posicao.coords.accuracy,
    });
  } catch (error) {
    console.warn("Erro ao obter localização atual:", error);

    try {
      const ultimaPosicao = await Location.getLastKnownPositionAsync();
      if (ultimaPosicao) {
        console.log("Recuperada última localização válida (Cache)");
        return criarPontoLocalizacao(lote, {
          latitude: ultimaPosicao.coords.latitude,
          longitude: ultimaPosicao.coords.longitude,
          accuracy: ultimaPosicao.coords.accuracy ?? 0,
        });
      }
    } catch (cacheError) {
      console.warn("Falha ao recuperar cache.");
    }

    console.warn("Usando localização padrão fixa.");
    return criarPontoLocalizacao(lote, {
      latitude: localizacaoPadrao.latitude,
      longitude: localizacaoPadrao.longitude,
      accuracy: 999,
    });
  }
};
