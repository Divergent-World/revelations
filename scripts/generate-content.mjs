import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { displayReference, mapCanvasToSceneIds, parseVplRevelation, relativeObjectKey, validateSceneMetadata } from "./lib/content.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const vaultRoot = path.resolve(process.env.APOCALYPSE_VAULT ?? path.join(repoRoot, "..", "Apocalypse Tapestry"));
const vplPath = process.env.WEB_VPL_PATH ?? "/private/tmp/engwebp_vpl.txt";
const contentDir = path.join(repoRoot, "content");
const romans = ["I", "II", "III", "IV", "V", "VI"];

const summaries = [
  "Christ is revealed as king, the Lamb is found worthy, and the opened scroll sets judgment in motion.",
  "God seals the faithful, heaven prepares the trumpets, and creation gives way to escalating judgment.",
  "The witnesses are vindicated, the dragon fails to destroy the woman, and beastly powers demand worship.",
  "The beast gathers worship, the Lamb answers, heaven warns, and the world is harvested.",
  "The bowls are poured out, Babylon is exposed and destroyed, and the marriage of the Lamb appears.",
  "Christ returns in victory, evil is judged, and the holy city opens into the life and presence of God.",
];

const movements = [
  [
    {
      label: "Revelation",
      title: "Christ appears and the revelation begins.",
      description: "The first scenes establish that John has received a divine vision. Christ is shown in majesty among the candlesticks, and the ‘seven churches’ are invoked as the audience of the revelation. The point here is not yet catastrophe. The point is authority: this vision comes from Christ, and it is meant for the Church.",
    },
    {
      label: "Heavenly worship",
      title: "The vision rises into heaven.",
      description: "The imagery then shifts from earth to the heavenly court. The elders cast down their crowns, which means heaven itself recognizes God’s rule. The mood becomes ceremonial and cosmic. You are no longer just in John’s private vision; you are in the throne room where the fate of the world is about to be disclosed.",
    },
    {
      label: "The Lamb and the scroll",
      title: "Everything turns on the sealed book and the Lamb.",
      description: "The central drama becomes: who is worthy to open the mysterious sealed book? The answer is the Lamb. The Lamb takes the book, and heaven responds with adoration. This is the hinge of the whole first tapestry: history is about to move because the worthy one has taken the scroll.",
    },
    {
      label: "Judgment and preservation",
      title: "Once the book begins to open, judgment starts unfolding in the world.",
      description: "Now the tone darkens sharply. The Horsemen begin to ride: the first signals conquest, the second war, the third famine, and the fourth death. These are not random monsters; they are like four blows falling on the earth in sequence. Then the martyrs appear, showing that faithful people suffer within this broken history. Then comes the terror of the sixth seal, where the created order itself seems shaken. And after all that dread, the section closes with the sealing of the 144,000—a sign that God still marks out and preserves his own amid the chaos.",
    },
  ],
  [
    {
      label: "The faithful sealed",
      title: "God marks out His people before the next wave of judgment.",
      description: "The tapestry opens with the 144,000 sealed. So before the next catastrophes begin, there is first an image of distinction and protection: God knows who are His. In the historical cycle, this functions like a pause after the seals and before the trumpets.",
    },
    {
      label: "Trumpets prepared",
      title: "Heaven prepares judgment through liturgy.",
      description: "Then the mood shifts upward: the angels receive the seven trumpets, and another angel handles the incense that represents the prayers of the saints. This is important because the coming judgments are not shown as random chaos. They are framed as proceeding from heaven, with the prayers of the faithful rising before God. The angel then casts the incense/fire to the earth, and the trumpet cycle begins.",
    },
    {
      label: "Creation struck",
      title: "Creation itself begins to break apart.",
      description: "The first run of trumpets strikes the natural world: hail and fire, the burning mountain thrown into the sea, Wormwood falling from heaven into the waters, and then the darkening of the sun, moon, and stars. So this middle section of Tapestry 2 is really about the world becoming disordered at the cosmic level — land, sea, rivers, sky, light itself.",
    },
    {
      label: "The abyss and war unleashed",
      title: "Judgment becomes demonic and militarized.",
      description: "Then the imagery grows more frightening and surreal. The fifth trumpet brings the locusts from the pit; the sixth trumpet releases the four angels; and finally comes the apocalyptic cavalry, the riders on fire-breathing horses, killing on a massive scale. So Tapestry 2 does not end with a quiet symbol. It ends with an escalation: from environmental catastrophe to infernal torment to warlike devastation.",
    },
  ],
  [
    {
      label: "Prophetic witness",
      title: "God sends prophetic witnesses into the world.",
      description: "The first movement centers on the two witnesses. They are not passive victims at first; they are given power, they testify, and they stand as God’s prophetic voice in the world. So the opening note of Tapestry 3 is not chaos but witness—truth being spoken in the face of opposition.",
    },
    {
      label: "Martyrdom and vindication",
      title: "The witnesses are struck down, but God overturns their defeat.",
      description: "Then the witnesses are slain, their bodies lie exposed and unburied, and it looks for a moment as though evil has won. But this humiliation is reversed: they rise and ascend into heaven, and an earthquake follows. So the second movement is really martyrdom followed by vindication. Revelation loves this pattern: what looks like defeat is not the end.",
    },
    {
      label: "Heavenly worship",
      title: "Heaven responds with worship, and the cosmic drama opens wider.",
      description: "After that comes the seventh trumpet, with the elders worshipping God in heaven. This is like a hinge. The story broadens from the local drama of the witnesses into a more cosmic unveiling. The temple in heaven is opened, and now the vision shifts toward one of Revelation’s most iconic images: the woman clothed with the sun and the great dragon waiting to devour her child.",
    },
    {
      label: "Cosmic war",
      title: "The dragon makes war, but the woman is preserved.",
      description: "This is the emotional heart of Tapestry 3. The woman and dragon scene introduces the deep mythic conflict: birth, threat, pursuit, escape. Then Saint Michael and his angels fight the dragon, the woman is given wings to flee, and when the dragon sends a flood after her, the earth swallows it up. So this whole movement is about satanic assault met by divine rescue.",
    },
    {
      label: "The beasts arise",
      title: "The dragon, frustrated, turns to political and religious monsters.",
      description: "At the end of the tapestry, the dragon does not simply disappear. Instead, he redirects his rage. He goes to war against those who keep God’s commandments, and then he gives power to the beast from the sea. The final scenes show the adoration of the dragon and the adoration of the beast. So the ending of Tapestry 3 is chilling: evil moves from open attack into organized, enthroned, worship-demanding power.",
    },
  ],
  [
    {
      label: "Counterfeit worship",
      title: "The beast’s order reaches its full public form.",
      description: "The tapestry opens in the world of false worship: the beast is adored, the beast from the earth performs signs, the image of the beast is venerated, and the ‘number of the beast’ appears. This is the moment where evil is no longer just violent—it becomes organized, symbolic, and socially enforced. It is a counterfeit kingdom demanding loyalty.",
    },
    {
      label: "The Lamb’s answer",
      title: "The Lamb answers the beast with a rival city and a rival song.",
      description: "Then the emotional weather changes. The Lamb appears on Mount Sion, and the redeemed sing the new song. This is one of Revelation’s great reversals: after the spectacle of beastly power, the tapestry suddenly shows a truer sovereignty. The beast has crowds, coercion, and spectacle; the Lamb has a holy remnant, purity, and worship.",
    },
    {
      label: "Angelic warnings",
      title: "Angels announce that judgment is now inevitable.",
      description: "Next come the proclamation scenes: the angel with the eternal gospel, the second angel predicting Babylon’s fall, and the third angel warning against allegiance to the beast. This movement is like heaven’s public declaration that history is no longer ambiguous. The world is being told, in advance, what is about to happen and why.",
    },
    {
      label: "Harvest and wrath",
      title: "The world is harvested.",
      description: "Then the imagery turns agricultural and terrible: the dream and rest of the just, the Last Harvest, the angel gathering the vine, and the Harvest of Grapes. This is judgment shown not as random destruction, but as reaping. Humanity has ripened into what it has chosen to become, and now it is gathered accordingly. It is one of Revelation’s most severe metaphors: history is cut down like grain and crushed like grapes.",
    },
    {
      label: "Bowls prepared",
      title: "The next wave of wrath is prepared.",
      description: "The tapestry closes with the Seven vials, which functions like a threshold scene. After proclamation and harvest, heaven prepares the bowls of wrath that will be poured out in the next tapestry. So Tapestry 4 ends not in resolution, but in poised inevitability—judgment is no longer merely announced; it is ready in the hand.",
    },
  ],
  [
    {
      label: "Wrath prepared",
      title: "Heaven hands judgment into the angels’ hands.",
      description: "The tapestry opens with the angels receiving the vials. This is a threshold moment: what Tapestry 4 prepared, Tapestry 5 now begins to pour out. The sense is no longer that judgment is merely announced; it is now being administered in sequence.",
    },
    {
      label: "Bowls of wrath",
      title: "The bowls strike the world one after another.",
      description: "Then come the actual plagues: the first vial on earth, the second vial on the sea, the fourth vial on the sun, the fifth and sixth vials, the unclean spirits, and the seventh vial on the air. The imagery moves across land, sea, sun, throne, river, spirits, and sky. So this middle stretch feels like total-system judgment: all the structures of the world are being touched, not just one kingdom or one city.",
    },
    {
      label: "Babylon revealed",
      title: "Evil gathers itself into one last glamorous form: Babylon.",
      description: "After the bowls, the focus narrows from global plagues to a single symbolic figure: the Whore of Babylon seated on the waters, then seated on the beast. This is important dramatically. Tapestry 5 says, in effect: behind the corruption of the world stands a seductive and imperial order—wealthy, intoxicating, splendid, and doomed. Babylon is not just ugliness; it is beautiful corruption.",
    },
    {
      label: "Babylon falls",
      title: "Babylon falls, and her destruction is made public and irreversible.",
      description: "Then the story turns from exposure to collapse: Fall of Babylon, Angel casting a millstone, and Harlot is cast into the flames. The millstone image is especially final—it means Babylon is not merely wounded or politically replaced; she is thrown down beyond recovery. The luxury, seduction, and false glory of that whole order are judged and ended.",
    },
    {
      label: "The true wedding",
      title: "After the false bride falls, the true bridegroom’s feast appears.",
      description: "The tapestry then makes one of Revelation’s sharpest reversals: after the harlot comes the marriage of the Lamb, and then Saint John and angel. In other words, once false union and false splendor are destroyed, true union is revealed. The tapestry closes not only on destruction, but on interpretation and invitation: John is shown what all this judgment was clearing the ground for.",
    },
  ],
  [
    {
      label: "The victorious rider",
      title: "Christ appears openly as victorious king and judge.",
      description: "The tapestry opens with the most triumphant martial image in the cycle: Christ on the White Horse. This is no longer the earlier atmosphere of warning, seals, or symbolic struggle at a distance. Now Christ is revealed in open conquest, as the one who comes to defeat the beastly powers directly. In the traditional Apocalypse sequence, this is the arrival of final divine intervention into history.",
    },
    {
      label: "Evil overthrown",
      title: "The beastly order collapses under divine victory.",
      description: "Then the enemies are overthrown: the defeated are cast into the pool of fire, and the dragon is enchained. This movement is about restraint and collapse. The forces that once strutted across the world—beast, false power, satanic rage—are no longer ascendant. They are judged, bound, and stripped of dominion.",
    },
    {
      label: "Final judgment",
      title: "There is one last resistance, and then final judgment.",
      description: "Revelation does not end with a simple military victory scene. After the dragon is bound, the tapestry still includes Judges and Satan attacks the Holy City, followed by Last Judgment. So the structure here is subtle: there is a pause, a final testing, and then the universal reckoning. This means Tapestry 6 is not just ‘evil loses’; it is ‘all things are brought to account.’",
    },
    {
      label: "New Jerusalem",
      title: "After judgment, the new world appears.",
      description: "Then the emotional world of the tapestry changes completely. The terrifying images give way to New Jerusalem, the angel measuring the city, and the ordered beauty of the renewed creation. The measuring scene matters because it suggests not chaos but perfection, proportion, and divine intentionality. What was torn apart in earlier tapestries is now reconstituted as a holy city.",
    },
    {
      label: "Communion",
      title: "The ending is not merely a city, but communion.",
      description: "The last movement is intimate and luminous: River of life, Saint John and the angel, and Saint John before God. That is a beautiful ending for the whole cycle. Revelation closes not only with architecture or victory, but with presence, vision, and relationship. The river signals renewal and abundance; John’s final encounters show that the end of apocalypse is not just destruction of evil, but beholding God.",
    },
  ],
];

function versesForSpans(chapters, spans) {
  return spans.map((span) => ({
    reference: displayReference([span]),
    verses: chapters
      .filter(({ chapter }) => chapter >= span.startChapter && chapter <= span.endChapter)
      .flatMap(({ chapter, verses }) => {
        const maxVerse = span.endVerse ?? Number.POSITIVE_INFINITY;
        return verses
          .filter(({ number }) => (chapter > span.startChapter || number >= span.startVerse) && (chapter < span.endChapter || number <= maxVerse))
          .map(({ number, text }) => ({ chapter, verse: number, text }));
      }),
  }));
}

async function hashFile(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function main() {
  const vpl = await readFile(vplPath, "utf8").catch(() => {
    throw new Error(`WEB verse-per-line source missing at ${vplPath}. Set WEB_VPL_PATH to engwebp_vpl.txt.`);
  });
  const revelation = parseVplRevelation(vpl);
  if (revelation.length !== 22) throw new Error(`Expected 22 Revelation chapters, found ${revelation.length}`);

  const expectedSceneIds = romans.flatMap((_, index) => {
    const tapestry = index + 1;
    return [
      `T${tapestry}-00`,
      ...["T", "B"].flatMap((row) => Array.from({ length: 7 }, (__, position) => `T${tapestry}-${row}${String(position + 1).padStart(2, "0")}`)),
    ];
  });
  const compactMetadata = JSON.parse(await readFile(path.join(contentDir, "scene-metadata.json"), "utf8"));
  const metadata = validateSceneMetadata(compactMetadata, expectedSceneIds, revelation);
  const sourceMap = [];
  const scenes = [];
  const tapestries = [];

  for (let index = 0; index < romans.length; index += 1) {
    const tapestryNumber = index + 1;
    const roman = romans[index];
    const canvas = JSON.parse(await readFile(path.join(vaultRoot, "Tapestries", roman, `${roman}.canvas`), "utf8"));
    const assignments = mapCanvasToSceneIds(tapestryNumber, canvas.nodes);
    const nodes = new Map(canvas.nodes.map((node) => [node.id, node]));
    const sceneIds = [];

    for (const [sceneId, nodeId] of assignments) {
      const node = nodes.get(nodeId);
      const slot = metadata.get(sceneId);
      if (!node || !slot) throw new Error(`${sceneId}: canvas node or scene metadata missing`);
      const sourcePath = node.file.replace(/^Apocalypse Tapestry\//, "");
      const absolutePath = path.join(vaultRoot, sourcePath);
      const image = await sharp(absolutePath).metadata();
      const checksum = await hashFile(absolutePath);
      const spans = slot.spans;
      const sceneSlot = sceneId.split("-")[1];
      const row = sceneSlot === "00" ? "lead" : sceneSlot.startsWith("T") ? "top" : "bottom";
      const position = sceneSlot === "00" ? 0 : Number(sceneSlot.slice(1));
      const originalKey = relativeObjectKey(sceneId, sourcePath);
      const originalExtension = path.extname(sourcePath).toLowerCase();
      const scene = {
        id: sceneId,
        tapestry: tapestryNumber,
        row,
        position,
        title: slot.title,
        scriptureSpans: spans,
        displayReference: displayReference(spans),
        passages: versesForSpans(revelation, spans),
        alt: `${slot.title}, illustrating ${displayReference(spans)}.`,
        images: {
          preview: `releases/v1/web/640/${sceneId}.webp`,
          reader: `releases/v1/web/1920/${sceneId}.webp`,
          original: originalKey,
        },
        width: image.width,
        height: image.height,
        checksum,
        attribution: "Ali Rahman / Divergent World",
        license: "CC BY-SA 4.0",
      };
      scenes.push(scene);
      sceneIds.push(sceneId);
      sourceMap.push({ id: sceneId, sourcePath, originalExtension, checksum });
    }

    tapestries.push({
      id: tapestryNumber,
      roman,
      summary: summaries[index],
      movements: movements[index],
      leadSceneId: `T${tapestryNumber}-00`,
      sceneIds,
    });
  }

  await mkdir(contentDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(contentDir, "source-map.json"), `${JSON.stringify(sourceMap, null, 2)}\n`),
    writeFile(path.join(contentDir, "tapestries.json"), `${JSON.stringify({ version: "v1", tapestries, scenes }, null, 2)}\n`),
    writeFile(path.join(contentDir, "revelation.web.json"), `${JSON.stringify({ translation: "World English Bible", source: "https://ebible.org/engwebp/", chapters: revelation }, null, 2)}\n`),
  ]);
  console.log(`Generated ${tapestries.length} tapestries, ${scenes.length} scenes, and ${revelation.length} chapters.`);
}

await main();
