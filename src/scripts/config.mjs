import { MODULE_ID } from "./constants.mjs";
import { minimumDistanceBetweenTokens } from "./utils.mjs";

export function registerConfig() {
  const defaultconfig = {};

  const shortcuts = {};
  shortcuts.healthState = shortcutHealthState;
  shortcuts.armorState = shortcutArmorState;
  shortcuts.distance = shortcutDistance;
  defaultconfig.shortcuts = shortcuts;

  // in theory users could register changes to the config before we actually add our stuff to it...
  const existingConfig = CONFIG[MODULE_ID];

  CONFIG[MODULE_ID] = foundry.utils.mergeObject(defaultconfig, existingConfig, {
    inplace: false,
  });
}

export function getConfigValue(path) {
  return foundry.utils.getProperty(CONFIG[MODULE_ID], path);
}

function shortcutHealthState(actor) {
  const pct = actor.system.attributes.hp.pct;
  const dmg = actor.system.attributes.hp.damage;
  const hp = actor.system.attributes.hp.value;

  let status;
  if (pct >= 100) {
    status = "Healthy";
  } else if (pct >= 50) {
    status = "Wounded";
  } else if (pct >= 5) {
    status = "Bloody";
  } else {
    status = "Almost Dead";
  }

  if (hp <= 0) {
    status = "Down";
  }

  return { value: `${status} (${dmg})` };
}

function shortcutArmorState(actor) {
  let armorType;
  if (actor.system.attributes.ac.calc === "natural") {
    armorType = "Natural";
  } else {
    armorType =
      actor.system.attributes.ac.equippedArmor?.system.type.label ?? "Clothing";
  }

  const shieldType = actor.system.attributes.ac.equippedShield
    ? "Shield"
    : "No Shield";
  return { value: `${armorType} + ${shieldType}` };
}

function shortcutDistance(token) {
  if (token instanceof TokenDocument) {
    token = token?.object;
  }

  const speaker = ChatMessage.implementation.getSpeaker();
  const userToken = game.canvas.tokens.get(speaker.token) || null;

  let text = NaN.toString();
  if ((userToken?.document) && (userToken !== token)) {
    const horizontalDistance = minimumDistanceBetweenTokens(
      token,
      userToken,
      game.scenes.current,
    );
    const verticalDistance = Math.abs(
      token.document.elevation - userToken.document.elevation,
    );
    let total = horizontalDistance;

    if (
      game.settings.get("core", "gridDiagonals") ===
      CONST.GRID_DIAGONALS.EQUIDISTANT
    ) {
      total = Math.max(horizontalDistance, verticalDistance);
    }

    text = `${total.toFixed(1)}  ${game.canvas.grid.units}`.trim();
  }

  return {
    value: text,
  };
}
