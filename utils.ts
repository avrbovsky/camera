import { useCallback, useEffect, useState } from "react";
import { CameraRef, CameraRefCallback, Dimensions } from "./types";
import { Camera as OriginalCamera } from "expo-camera";

export function useAutoSize(
  dimensions: Dimensions | null
): [string | null, Dimensions | null, CameraRefCallback] {
  const [supportedAspectRatios, ref] = useSupportedAspectRatios();
  const [suggestedAspectRatio, setSuggestedAspectRatio] = useState<
    string | null
  >(null);
  const [suggestedDimensions, setSuggestedDimensions] =
    useState<Dimensions | null>(null);

  useEffect(() => {
    const suggestedAspectRatio = findClosestAspectRatio(
      supportedAspectRatios,
      dimensions
    );
    const suggestedDimensions = calculateSuggestedDimensions(
      dimensions,
      suggestedAspectRatio
    );

    if (!suggestedAspectRatio || !suggestedDimensions) {
      setSuggestedAspectRatio(null);
      setSuggestedDimensions(null);
    } else {
      setSuggestedAspectRatio(suggestedAspectRatio);
      setSuggestedDimensions(suggestedDimensions);
    }
  }, [dimensions, supportedAspectRatios]);

  return [suggestedAspectRatio, suggestedDimensions, ref];
}

// Get the supported aspect ratios from the camera ref when the node is available
// NOTE: this will fail if the camera isn't ready yet. So we need to avoid setting the
// ref until the camera ready callback has fired
function useSupportedAspectRatios(): [string[] | null, CameraRefCallback] {
  const [aspectRatios, setAspectRatios] = useState<string[] | null>(null);

  const ref = useCallback(
    (node: CameraRef | null) => {
      async function getSupportedAspectRatiosAsync(node: OriginalCamera) {
        try {
          const result = await node.getSupportedRatiosAsync();
          setAspectRatios(result);
        } catch (e) {
          console.error(e);
        }
      }

      if (node !== null) {
        getSupportedAspectRatiosAsync(node);
      }
    },
    [setAspectRatios]
  );

  return [aspectRatios, ref];
}

export const useComponentDimensions = (): [
  Dimensions | null,
  (e: any) => void
] => {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  const onLayout = useCallback(
    (event: any) => {
      const { width, height } = event.nativeEvent.layout;
      setDimensions({ width, height });
    },
    [setDimensions]
  );

  return [dimensions, onLayout];
};

function ratioStringToNumber(ratioString: string) {
  const [a, b] = ratioString.split(":");
  return parseInt(a, 10) / parseInt(b, 10);
}

function findClosestAspectRatio(
  supportedAspectRatios: string[] | null,
  dimensions: Dimensions | null
) {
  if (!supportedAspectRatios || !dimensions) {
    return null;
  }

  try {
    const dimensionsRatio =
      Math.max(dimensions.height, dimensions.width) /
      Math.min(dimensions.height, dimensions.width);

    const aspectRatios = [...supportedAspectRatios];
    aspectRatios.sort((a: string, b: string) => {
      const ratioA = ratioStringToNumber(a);
      const ratioB = ratioStringToNumber(b);
      return (
        Math.abs(dimensionsRatio - ratioA) - Math.abs(dimensionsRatio - ratioB)
      );
    });

    return aspectRatios[0];
  } catch (e) {
    // If something unexpected happens just bail out
    console.error(e);
    return null;
  }
}

function calculateSuggestedDimensions(
  containerDimensions: Dimensions | null,
  ratio: string | null
) {
  if (!ratio || !containerDimensions) {
    return null;
  }

  try {
    const ratioNumber = ratioStringToNumber(ratio);
    const width = containerDimensions.width;
    const height = width * ratioNumber;
    return { width, height };
  } catch (e) {
    // If something unexpected happens just bail out
    console.error(e);
    return null;
  }
}
