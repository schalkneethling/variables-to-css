function rgbToHex(rgbValue: { r: number; g: number; b: number; a: number }) {
  // the values are in normalized form so first multiple by 255
  const r = Math.round(rgbValue.r * 255);
  const g = Math.round(rgbValue.g * 255);
  const b = Math.round(rgbValue.b * 255);

  const rHex = r.toString(16).padStart(2, "0");
  const gHex = g.toString(16).padStart(2, "0");
  const bHex = b.toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
}

async function getVariables(
  collections: VariableCollection[],
  allVariables: string[] = [],
) {
  if (!collections) {
    return;
  }

  if (collections.length > 0) {
    const collection = collections.pop() as VariableCollection;
    const variableIds = collection.variableIds;
    const mode1Id = collection.modes[0].modeId;

    const mappedVariables = await Promise.all(
      variableIds?.map(async (variableId: string) => {
        const variable = await figma.variables.getVariableByIdAsync(variableId);

        const hexValue = rgbToHex(
          variable?.valuesByMode[mode1Id] as unknown as {
            r: number;
            g: number;
            b: number;
            a: number;
          },
        );
        return `${variable?.name}: ${hexValue};`;
      }),
    );

    if (mappedVariables.length > 0) {
      allVariables.push(...mappedVariables);
    }

    return await getVariables(collections, allVariables);
  }

  return allVariables;
}

async function getVariableCollections() {
  const localCollections =
    await figma.variables.getLocalVariableCollectionsAsync();

  if (!localCollections) {
    return;
  }

  return await getVariables(localCollections);
}

figma.ui.onmessage = async (message) => {
  if (message === "export") {
    figma.ui.postMessage(await getVariableCollections());
  }
};

figma.showUI(__html__, { width: 1000, height: 500, title: "Export to CSS" });
