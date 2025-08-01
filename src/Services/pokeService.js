export function getPokemon({ url }) {
  return new Promise((resolve, reject) => {
    fetch(url).then(res => res.json())
      .then(data => {
        resolve(data)
      })
  })
}

export async function getAllPokemon(url) {
  return new Promise((resolve, reject) => {
    fetch(url).then(res => res.json())
      .then(data => {
        resolve(data)
      })
  })
}

export async function getPokemonInfo(name) {
  const url = `https://pokeapi.co/api/v2/pokemon-species/${name}/`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    // Extract English flavor text
    const flavorTextEntry = data.flavor_text_entries.find(
      entry => entry.language.name === "en"
    );
    const flavorText = flavorTextEntry
      ? flavorTextEntry.flavor_text.replace(/\n|\f/g, ' ')
      : "No description found.";

    // Extract English genus
    const genusEntry = data.genera.find(
      entry => entry.language.name === "en"
    );
    const genus = genusEntry ? genusEntry.genus : "Unknown Pokémon";

    return { description: flavorText, genus };
  } catch (error) {
    console.error("Error fetching Pokémon info:", error);
    return { description: "Description unavailable.", genus: "Unknown Pokémon" };
  }
}