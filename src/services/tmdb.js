import axios from 'axios';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const tmdbClient = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
    language: 'hu-HU',
  },
});

export const MOODS = [
  {
    id: 'mind_bending',
    label: 'Kikészíti az agyam 🧠',
    description: 'Fordulatok, rejtélyek, pszichothriller',
    movieParams: { with_genres: '9648,53', 'vote_average.gte': 7.0 },
    tvParams: { with_genres: '9648,10765', 'vote_average.gte': 7.0 }
  },
  {
    id: 'popcorn',
    label: 'Kikapcsolom az agyam 🍿',
    description: 'Pörgős akció, könnyed látványvilág',
    movieParams: { with_genres: '28,12', 'with_runtime.lte': 120 },
    tvParams: { with_genres: '10759' }
  },
  {
    id: 'feel_good',
    label: 'Kuckózós / Nevetős 🕯️',
    description: 'Szerethető vígjátékok, animációk',
    movieParams: { with_genres: '35,16', 'vote_average.gte': 6.5 },
    tvParams: { with_genres: '35,16', 'vote_average.gte': 6.5 }
  },
  {
    id: 'scary',
    label: 'Rettegni akarok 😱',
    description: 'Horror, feszült atmoszféra',
    movieParams: { with_genres: '27', 'vote_average.gte': 6.0 },
    tvParams: { with_genres: '9648,10765', 'vote_average.gte': 6.0 }
  }
];

// Kezdőlapi kategóriás sorok lekérése
export const getHomeCategories = async (type = 'movie') => {
  try {
    const [trending, topRated, action, comedy] = await Promise.all([
      tmdbClient.get(`/trending/${type}/week`),
      tmdbClient.get(`/${type}/top_rated`),
      tmdbClient.get(`/discover/${type}`, { params: { with_genres: type === 'movie' ? '28' : '10759' } }),
      tmdbClient.get(`/discover/${type}`, { params: { with_genres: '35' } })
    ]);

    return [
      { title: '🔥 Trendi ezen a héten', items: trending.data.results },
      { title: '⭐ Legjobbra értékelt', items: topRated.data.results },
      { title: '💥 Pörgős Akció', items: action.data.results },
      { title: '😂 Sírva nevetős Vígjátékok', items: comedy.data.results }
    ];
  } catch (error) {
    console.error("Hiba a kezdőlapi adatoknál:", error);
    return [];
  }
};

export const discoverContent = async (type = 'movie', moodId) => {
  const selectedMood = MOODS.find(m => m.id === moodId);
  if (!selectedMood) return [];

  const moodParams = type === 'tv' ? selectedMood.tvParams : selectedMood.movieParams;

  const response = await tmdbClient.get(`/discover/${type}`, {
    params: {
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
      ...moodParams,
      page: Math.floor(Math.random() * 3) + 1
    }
  });

  return response.data.results;
};

// Véletlenszerű film/sorozat lekérése a Ruletthez
export const getRandomMovie = async (type = 'movie') => {
  const randomPage = Math.floor(Math.random() * 10) + 1;
  const response = await tmdbClient.get(`/discover/${type}`, {
    params: {
      sort_by: 'popularity.desc',
      'vote_count.gte': 200,
      page: randomPage
    }
  });
  const results = response.data.results;
  return results[Math.floor(Math.random() * results.length)];
};

export const getWatchProviders = async (type = 'movie', id) => {
  try {
    const response = await tmdbClient.get(`/${type}/${id}/watch/providers`);
    return response.data.results?.HU || null;
  } catch (error) {
    console.error("Hiba a JustWatch adatoknál:", error);
    return null;
  }
};