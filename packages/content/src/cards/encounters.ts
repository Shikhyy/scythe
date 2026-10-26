import {
  type CardId,
  type EncounterCard,
  type EncounterOptionCost,
  type EncounterOptionReward,
  makeCardId,
  ResourceType,
} from "@scythe/domain";

/**
 * 28 Encounter Cards manifest for Scythe (SRC-001 p. 3, 24).
 * Each card features 3 distinct options:
 * - Option 1: Free benefit (gain resources, coins, power, or cards)
 * - Option 2: Pay small cost (coins or power) for a greater benefit
 * - Option 3: Pay popularity for a major benefit (free mech, structure, recruit, large resource bundle)
 */

function generateEncounterCards(): EncounterCard[] {
  const cards: EncounterCard[] = [];

  const rawSpecs: {
    title: string;
    prompt: string;
    opt1: { desc: string; reward: EncounterOptionReward };
    opt2: { desc: string; cost?: EncounterOptionCost; reward: EncounterOptionReward };
    opt3: { desc: string; cost?: EncounterOptionCost; reward: EncounterOptionReward };
  }[] = [
    {
      title: "Abandoned Outpost",
      prompt: "You find the crumbling remains of a border outpost in the snow.",
      opt1: {
        desc: "Scavenge the wreckage: gain 2 metal",
        reward: { resources: { [ResourceType.Metal]: 2 } },
      },
      opt2: {
        desc: "Pay locals 2 coins to repair equipment: gain 1 mech",
        cost: { coins: 2 },
        reward: { deployMechFree: true },
      },
      opt3: {
        desc: "Threaten locals: pay 1 popularity to gain 3 food",
        cost: { popularity: 1 },
        reward: { resources: { [ResourceType.Food]: 3 } },
      },
    },
    {
      title: "Rustic Farmstead",
      prompt: "A quiet farmhouse surrounded by bountiful crops.",
      opt1: {
        desc: "Accept fresh produce: gain 2 food",
        reward: { resources: { [ResourceType.Food]: 2 } },
      },
      opt2: {
        desc: "Buy stored grain: pay 1 coin for 2 food and 1 popularity",
        cost: { coins: 1 },
        reward: { resources: { [ResourceType.Food]: 2 }, popularity: 1 },
      },
      opt3: {
        desc: "Conscript farmhands: pay 1 popularity to gain 2 workers",
        cost: { popularity: 1 },
        reward: { gainWorkersCount: 2 },
      },
    },
    {
      title: "Fallen Mech",
      prompt: "A smoldering mechanical titan lies motionless in a ditch.",
      opt1: {
        desc: "Salvage parts: gain 2 metal",
        reward: { resources: { [ResourceType.Metal]: 2 } },
      },
      opt2: {
        desc: "Hire salvagers: pay 1 coin for 2 oil and 1 metal",
        cost: { coins: 1 },
        reward: { resources: { [ResourceType.Oil]: 2, [ResourceType.Metal]: 1 } },
      },
      opt3: {
        desc: "Repurpose the hull: pay 1 popularity to deploy 1 mech",
        cost: { popularity: 1 },
        reward: { deployMechFree: true },
      },
    },
    {
      title: "Oil Rig Derelict",
      prompt: "An experimental drilling pump still oozing crude oil.",
      opt1: {
        desc: "Collect surface oil: gain 2 oil",
        reward: { resources: { [ResourceType.Oil]: 2 } },
      },
      opt2: {
        desc: "Refine on site: pay 1 coin for 2 oil and 1 power",
        cost: { coins: 1 },
        reward: { resources: { [ResourceType.Oil]: 2 }, power: 1 },
      },
      opt3: {
        desc: "Strip drill machinery: pay 1 popularity to build 1 structure",
        cost: { popularity: 1 },
        reward: { buildStructureFree: true },
      },
    },
    {
      title: "Forest Logging Camp",
      prompt: "Lumberjacks hauling timber across icy paths.",
      opt1: {
        desc: "Gather fallen logs: gain 2 wood",
        reward: { resources: { [ResourceType.Wood]: 2 } },
      },
      opt2: {
        desc: "Purchase seasoned lumber: pay 1 coin for 3 wood",
        cost: { coins: 1 },
        reward: { resources: { [ResourceType.Wood]: 3 } },
      },
      opt3: {
        desc: "Seize camp structures: pay 1 popularity to build 1 structure",
        cost: { popularity: 1 },
        reward: { buildStructureFree: true },
      },
    },
    {
      title: "Wandering Merchant",
      prompt: "A caravan of exotic traders offering rare provisions.",
      opt1: {
        desc: "Trade small talk: gain $1 and 1 popularity",
        reward: { coins: 1, popularity: 1 },
      },
      opt2: {
        desc: "Purchase wares: pay 1 coin for 2 food and 1 combat card",
        cost: { coins: 1 },
        reward: { resources: { [ResourceType.Food]: 2 }, combatCardsCount: 1 },
      },
      opt3: {
        desc: "Confiscate caravan goods: pay 2 popularity for 4 coins and 2 metal",
        cost: { popularity: 2 },
        reward: { coins: 4, resources: { [ResourceType.Metal]: 2 } },
      },
    },
    {
      title: "Village Festival",
      prompt: "Villagers singing folk songs around a roaring bonfire.",
      opt1: {
        desc: "Join festivities: gain 1 popularity and 1 combat card",
        reward: { popularity: 1, combatCardsCount: 1 },
      },
      opt2: {
        desc: "Sponsor feast: pay 1 coin for 2 popularity and 1 power",
        cost: { coins: 1 },
        reward: { popularity: 2, power: 1 },
      },
      opt3: {
        desc: "Levy war tax: pay 2 popularity for 4 coins",
        cost: { popularity: 2 },
        reward: { coins: 4 },
      },
    },
    {
      title: "Trench Line",
      prompt: "Abandoned military trenches barbed with wire and shells.",
      opt1: { desc: "Recover discarded munitions: gain 2 power", reward: { power: 2 } },
      opt2: {
        desc: "Pay scavengers: pay 1 coin for 2 power and 1 combat card",
        cost: { coins: 1 },
        reward: { power: 2, combatCardsCount: 1 },
      },
      opt3: {
        desc: "Claim defensive fortification: pay 1 popularity to build 1 structure",
        cost: { popularity: 1 },
        reward: { buildStructureFree: true },
      },
    },
    {
      title: "Mountain Hermit",
      prompt: "An elderly scholar living high in a secluded mountain cavern.",
      opt1: {
        desc: "Listen to counsel: gain 1 popularity and 1 power",
        reward: { popularity: 1, power: 1 },
      },
      opt2: {
        desc: "Offer donation: pay 1 coin for 2 combat cards",
        cost: { coins: 1 },
        reward: { combatCardsCount: 2 },
      },
      opt3: {
        desc: "Raid library: pay 1 popularity for 2 oil and 2 metal",
        cost: { popularity: 1 },
        reward: { resources: { [ResourceType.Oil]: 2, [ResourceType.Metal]: 2 } },
      },
    },
    {
      title: "Refugee Train",
      prompt: "Families fleeing frontline warfare seeking safe harbor.",
      opt1: {
        desc: "Point the way: gain 1 popularity and 1 food",
        reward: { popularity: 1, resources: { [ResourceType.Food]: 1 } },
      },
      opt2: {
        desc: "Feed the hungry: pay 1 food for 2 popularity and 1 combat card",
        cost: { coins: 1 },
        reward: { popularity: 2, combatCardsCount: 1 },
      },
      opt3: {
        desc: "Recruit soldiers: pay 1 popularity to enlist 1 recruit",
        cost: { popularity: 1 },
        reward: { enlistRecruitFree: true },
      },
    },
    {
      title: "Blacksmith Guild",
      prompt: "Furnaces blasting heat as smiths forge iron tools and armor.",
      opt1: {
        desc: "Acquire surplus iron: gain 2 metal",
        reward: { resources: { [ResourceType.Metal]: 2 } },
      },
      opt2: {
        desc: "Commission repairs: pay 1 coin for 2 metal and 1 power",
        cost: { coins: 1 },
        reward: { resources: { [ResourceType.Metal]: 2 }, power: 1 },
      },
      opt3: {
        desc: "Take over the foundry: pay 1 popularity to deploy 1 mech",
        cost: { popularity: 1 },
        reward: { deployMechFree: true },
      },
    },
    {
      title: "Hunters' Lodge",
      prompt: "Trappers skinning game in a dense pine forest.",
      opt1: {
        desc: "Share rations: gain 2 food",
        reward: { resources: { [ResourceType.Food]: 2 } },
      },
      opt2: {
        desc: "Buy pelts and meat: pay 1 coin for 2 food and 1 power",
        cost: { coins: 1 },
        reward: { resources: { [ResourceType.Food]: 2 }, power: 1 },
      },
      opt3: {
        desc: "Conscript rangers: pay 1 popularity to enlist 1 recruit",
        cost: { popularity: 1 },
        reward: { enlistRecruitFree: true },
      },
    },
    {
      title: "River Barges",
      prompt: "Flatboats laden with supplies navigating shallow river bends.",
      opt1: {
        desc: "Help moor boats: gain 1 food and 1 wood",
        reward: { resources: { [ResourceType.Food]: 1, [ResourceType.Wood]: 1 } },
      },
      opt2: {
        desc: "Purchase cargo: pay 1 coin for 2 wood and 1 oil",
        cost: { coins: 1 },
        reward: { resources: { [ResourceType.Wood]: 2, [ResourceType.Oil]: 1 } },
      },
      opt3: {
        desc: "Seize barge timber: pay 1 popularity to build 1 structure",
        cost: { popularity: 1 },
        reward: { buildStructureFree: true },
      },
    },
    {
      title: "Field Hospital",
      prompt: "Medics tending to wounded soldiers in canvas tents.",
      opt1: {
        desc: "Comfort wounded: gain 1 popularity and 1 combat card",
        reward: { popularity: 1, combatCardsCount: 1 },
      },
      opt2: {
        desc: "Donate medicine: pay 1 coin for 2 popularity and 1 power",
        cost: { coins: 1 },
        reward: { popularity: 2, power: 1 },
      },
      opt3: {
        desc: "Discharge convalescents: pay 1 popularity to enlist 1 recruit",
        cost: { popularity: 1 },
        reward: { enlistRecruitFree: true },
      },
    },
    {
      title: "Mining Excavation",
      prompt: "Miners hoisting ore from a deep tunnel shaft.",
      opt1: {
        desc: "Gather slag: gain 2 metal",
        reward: { resources: { [ResourceType.Metal]: 2 } },
      },
      opt2: {
        desc: "Fund deeper shafts: pay 1 coin for 2 metal and 1 oil",
        cost: { coins: 1 },
        reward: { resources: { [ResourceType.Metal]: 2, [ResourceType.Oil]: 1 } },
      },
      opt3: {
        desc: "Fortify the shaft: pay 1 popularity to build 1 structure",
        cost: { popularity: 1 },
        reward: { buildStructureFree: true },
      },
    },
    {
      title: "Wayside Shrine",
      prompt: "A stone icon where travelers pause for quiet prayer.",
      opt1: { desc: "Offer respect: gain 1 popularity", reward: { popularity: 1 } },
      opt2: {
        desc: "Leave offering: pay 1 coin for 2 popularity and 1 power",
        cost: { coins: 1 },
        reward: { popularity: 2, power: 1 },
      },
      opt3: {
        desc: "Pillage relic: pay 2 popularity for 4 coins and 1 combat card",
        cost: { popularity: 2 },
        reward: { coins: 4, combatCardsCount: 1 },
      },
    },
    {
      title: "Gypsy Encampment",
      prompt: "Vibrant caravans with fortune tellers and musicians.",
      opt1: { desc: "Hear a fortune: gain 1 combat card", reward: { combatCardsCount: 1 } },
      opt2: {
        desc: "Pay the oracle: pay 1 coin for 2 combat cards and 1 power",
        cost: { coins: 1 },
        reward: { combatCardsCount: 2, power: 1 },
      },
      opt3: {
        desc: "Draft scouts: pay 1 popularity to enlist 1 recruit",
        cost: { popularity: 1 },
        reward: { enlistRecruitFree: true },
      },
    },
    {
      title: "Old Windmill",
      prompt: "Sails turning slowly against the gray horizon.",
      opt1: {
        desc: "Collect milled flour: gain 2 food",
        reward: { resources: { [ResourceType.Food]: 2 } },
      },
      opt2: {
        desc: "Pay miller: pay 1 coin for 2 food and 1 wood",
        cost: { coins: 1 },
        reward: { resources: { [ResourceType.Food]: 2, [ResourceType.Wood]: 1 } },
      },
      opt3: {
        desc: "Fortify the mill: pay 1 popularity to build 1 structure",
        cost: { popularity: 1 },
        reward: { buildStructureFree: true },
      },
    },
    {
      title: "Battlefield Scavengers",
      prompt: "Vultures and looters picking through scorched combat debris.",
      opt1: {
        desc: "Drive looters off: gain 1 power and 1 metal",
        reward: { power: 1, resources: { [ResourceType.Metal]: 1 } },
      },
      opt2: {
        desc: "Buy weapons: pay 1 coin for 2 power and 1 combat card",
        cost: { coins: 1 },
        reward: { power: 2, combatCardsCount: 1 },
      },
      opt3: {
        desc: "Rebuild wreckage: pay 1 popularity to deploy 1 mech",
        cost: { popularity: 1 },
        reward: { deployMechFree: true },
      },
    },
    {
      title: "Railroad Siding",
      prompt: "Rusting flatbed wagons parked on overgrown tracks.",
      opt1: {
        desc: "Unload freight: gain 2 wood",
        reward: { resources: { [ResourceType.Wood]: 2 } },
      },
      opt2: {
        desc: "Tow wagons: pay 1 coin for 2 wood and 1 metal",
        cost: { coins: 1 },
        reward: { resources: { [ResourceType.Wood]: 2, [ResourceType.Metal]: 1 } },
      },
      opt3: {
        desc: "Convert cars into bunker: pay 1 popularity to build 1 structure",
        cost: { popularity: 1 },
        reward: { buildStructureFree: true },
      },
    },
    {
      title: "Frontier Tavern",
      prompt: "Laughter and clinking steins warm the cold night.",
      opt1: {
        desc: "Share a drink: gain 1 combat card and 1 food",
        reward: { combatCardsCount: 1, resources: { [ResourceType.Food]: 1 } },
      },
      opt2: {
        desc: "Buy round of drinks: pay 1 coin for 2 popularity and 1 combat card",
        cost: { coins: 1 },
        reward: { popularity: 2, combatCardsCount: 1 },
      },
      opt3: {
        desc: "Brawl and recruit: pay 1 popularity to enlist 1 recruit",
        cost: { popularity: 1 },
        reward: { enlistRecruitFree: true },
      },
    },
    {
      title: "Stray Bear",
      prompt: "A giant Eurasian brown bear rummaging for winter berries.",
      opt1: {
        desc: "Tame with honey: gain 1 popularity and 1 power",
        reward: { popularity: 1, power: 1 },
      },
      opt2: {
        desc: "Feed beef: pay 1 coin for 2 power and 1 combat card",
        cost: { coins: 1 },
        reward: { power: 2, combatCardsCount: 1 },
      },
      opt3: {
        desc: "Arm the beast: pay 1 popularity for 3 power",
        cost: { popularity: 1 },
        reward: { power: 3 },
      },
    },
    {
      title: "Hydroelectric Dam",
      prompt: "Concrete gates churning roaring white river foam.",
      opt1: { desc: "Tap power line: gain 2 power", reward: { power: 2 } },
      opt2: {
        desc: "Hire engineers: pay 1 coin for 2 power and 1 oil",
        cost: { coins: 1 },
        reward: { power: 2, resources: { [ResourceType.Oil]: 1 } },
      },
      opt3: {
        desc: "Occupy power station: pay 1 popularity to build 1 structure",
        cost: { popularity: 1 },
        reward: { buildStructureFree: true },
      },
    },
    {
      title: "Telegraph Station",
      prompt: "Poles buzzing with urgent dispatches across Europa.",
      opt1: { desc: "Intercept messages: gain 1 combat card", reward: { combatCardsCount: 1 } },
      opt2: {
        desc: "Transmit orders: pay 1 coin for 2 combat cards",
        cost: { coins: 1 },
        reward: { combatCardsCount: 2 },
      },
      opt3: {
        desc: "Call reserves: pay 1 popularity to enlist 1 recruit",
        cost: { popularity: 1 },
        reward: { enlistRecruitFree: true },
      },
    },
    {
      title: "Peasant Uprising",
      prompt: "Pitchforks and torches raised against local lords.",
      opt1: { desc: "Calm the mob: gain 1 popularity", reward: { popularity: 1 } },
      opt2: {
        desc: "Arm the rebels: pay 1 power for 2 popularity and 2 food",
        cost: { power: 1 },
        reward: { popularity: 2, resources: { [ResourceType.Food]: 2 } },
      },
      opt3: {
        desc: "Direct anger at rivals: pay 1 popularity for 3 coins and 1 combat card",
        cost: { popularity: 1 },
        reward: { coins: 3, combatCardsCount: 1 },
      },
    },
    {
      title: "Secret Cache",
      prompt: "A concealed trapdoor under a frozen haystack.",
      opt1: {
        desc: "Loot rations: gain 1 food and 1 coin",
        reward: { resources: { [ResourceType.Food]: 1 }, coins: 1 },
      },
      opt2: {
        desc: "Hire locksmith: pay 1 coin for 2 oil and 2 metal",
        cost: { coins: 1 },
        reward: { resources: { [ResourceType.Oil]: 2, [ResourceType.Metal]: 2 } },
      },
      opt3: {
        desc: "Assemble prototype: pay 1 popularity to deploy 1 mech",
        cost: { popularity: 1 },
        reward: { deployMechFree: true },
      },
    },
    {
      title: "Royal Envoy",
      prompt: "A gold-trimmed carriage bearing an emissary and armed guards.",
      opt1: { desc: "Receive diplomat: gain 2 coins", reward: { coins: 2 } },
      opt2: {
        desc: "Host banquet: pay 1 coin for 2 popularity and 2 coins",
        cost: { coins: 1 },
        reward: { popularity: 2, coins: 2 },
      },
      opt3: {
        desc: "Hold envoy hostage: pay 2 popularity for 5 coins",
        cost: { popularity: 2 },
        reward: { coins: 5 },
      },
    },
    {
      title: "Factory Expedition",
      prompt: "A team of researchers mapping the perimeter of the Factory.",
      opt1: {
        desc: "Share survey notes: gain 1 popularity and 1 power",
        reward: { popularity: 1, power: 1 },
      },
      opt2: {
        desc: "Buy schematics: pay 1 coin for 2 combat cards and 1 power",
        cost: { coins: 1 },
        reward: { combatCardsCount: 2, power: 1 },
      },
      opt3: {
        desc: "Confiscate walker prototype: pay 1 popularity to deploy 1 mech",
        cost: { popularity: 1 },
        reward: { deployMechFree: true },
      },
    },
  ];

  for (let i = 0; i < rawSpecs.length; i++) {
    const s = rawSpecs[i]!;
    const num = i + 1;
    const pad = String(num).padStart(2, "0");
    cards.push({
      id: makeCardId(`ENC_${pad}`),
      category: "ENCOUNTER_CARD",
      number: num,
      title: s.title,
      prompt: s.prompt,
      rulesRef: "SRC-001 p. 24",
      licenseStatus: "PLACEHOLDER",
      isPlaceholder: true,
      version: "1.0.0",
      locale: "en-US",
      visibility: "PUBLIC",
      options: [
        { index: 1, description: s.opt1.desc, reward: s.opt1.reward },
        { index: 2, description: s.opt2.desc, cost: s.opt2.cost, reward: s.opt2.reward },
        { index: 3, description: s.opt3.desc, cost: s.opt3.cost, reward: s.opt3.reward },
      ],
    });
  }

  return cards;
}

export const ALL_ENCOUNTER_CARDS: readonly EncounterCard[] = generateEncounterCards();

const ENCOUNTER_MAP = new Map<string, EncounterCard>(ALL_ENCOUNTER_CARDS.map((e) => [e.id, e]));

export function getEncounterCard(id: CardId | string): EncounterCard | undefined {
  return ENCOUNTER_MAP.get(id);
}
