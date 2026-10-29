<script setup>
import { ref, onMounted, watch } from 'vue';
import { MOODS, discoverContent, getHomeCategories, getRandomMovie, getWatchProviders, IMAGE_BASE_URL } from './services/tmdb';
import { Film, Tv, RefreshCw, Dices, Sparkles, Home } from 'lucide-vue-next';

const currentTab = ref('home'); // 'home', 'mood', 'roulette'
const contentType = ref('movie'); // 'movie' vagy 'tv'

// Állapotok
const homeCategories = ref([]);
const selectedMood = ref(null);
const moodRecommendation = ref(null);
const rouletteResult = ref(null);
const providers = ref(null);
const loading = ref(false);

// Rulett animációs állapot
const isSpinning = ref(false);

// Kezdőlapi adatok betöltése
const loadHome = async () => {
  loading.value = true;
  homeCategories.value = await getHomeCategories(contentType.value);
  loading.value = false;
};

onMounted(() => {
  loadHome();
});

watch(contentType, () => {
  if (currentTab.value === 'home') {
    loadHome();
  } else if (currentTab.value === 'mood' && selectedMood.value) {
    handleMoodSearch(selectedMood.value);
  }
});

// Hangulat szerinti keresés
const handleMoodSearch = async (moodId) => {
  selectedMood.value = moodId;
  loading.value = true;
  moodRecommendation.value = null;
  providers.value = null;

  try {
    const results = await discoverContent(contentType.value, moodId);
    if (results && results.length > 0) {
      const randomItem = results[Math.floor(Math.random() * results.length)];
      moodRecommendation.value = randomItem;
      providers.value = await getWatchProviders(contentType.value, randomItem.id);
    }
  } finally {
    loading.value = false;
  }
};

// Rulett pörgetés
const spinRoulette = async () => {
  if (isSpinning.value) return;
  isSpinning.value = true;
  rouletteResult.value = null;
  providers.value = null;

  setTimeout(async () => {
    const randomItem = await getRandomMovie(contentType.value);
    rouletteResult.value = randomItem;
    if (randomItem) {
      providers.value = await getWatchProviders(contentType.value, randomItem.id);
    }
    isSpinning.value = false;
  }, 1500); // 1.5 másodperces pörgetési effekt
};

// Egy elemre kattintva a csempés listából
const selectItem = async (item) => {
  moodRecommendation.value = item;
  currentTab.value = 'mood';
  selectedMood.value = null;
  providers.value = await getWatchProviders(contentType.value, item.id);
};
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
    <!-- Top Navigáció Bar -->
    <header class="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <h1 @click="currentTab = 'home'" class="text-2xl font-black text-rose-500 cursor-pointer tracking-tight flex items-center gap-2">
          <span>MitNézzünk?</span>
        </h1>
        
        <!-- Film / Sorozat Választó -->
        <div class="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs sm:text-sm">
          <button 
            @click="contentType = 'movie'" 
            :class="['px-3 py-1 rounded-md font-medium transition', contentType === 'movie' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white']"
          >
            Filmek
          </button>
          <button 
            @click="contentType = 'tv'" 
            :class="['px-3 py-1 rounded-md font-medium transition', contentType === 'tv' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white']"
          >
            Sorozatok
          </button>
        </div>
      </div>

      <!-- Menüpontok -->
      <nav class="flex items-center gap-2">
        <button 
          @click="currentTab = 'home'" 
          :class="['flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition', currentTab === 'home' ? 'bg-slate-800 text-rose-400 border border-slate-700' : 'text-slate-400 hover:text-white']"
        >
          <Home :size="16" /> Kezdőlap
        </button>
        <button 
          @click="currentTab = 'mood'" 
          :class="['flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition', currentTab === 'mood' ? 'bg-slate-800 text-rose-400 border border-slate-700' : 'text-slate-400 hover:text-white']"
        >
          <Sparkles :size="16" /> Hangulatok
        </button>
        <button 
          @click="currentTab = 'roulette'; if(!rouletteResult) spinRoulette();" 
          :class="['flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition', currentTab === 'roulette' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700']"
        >
          <Dices :size="16" /> Film-Rulett
        </button>
      </nav>
    </header>

    <!-- FŐ TARTALOM TERÜLET -->
    <main class="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">

      <!-- 1. KEZDŐLAP: NETFLIX SZERŰ CSAMPÉS LISTÁK -->
      <div v-if="currentTab === 'home'" class="space-y-8">
        <div v-if="loading" class="flex justify-center items-center py-20 text-rose-500">
          <RefreshCw class="animate-spin" :size="32" />
        </div>

        <div v-else v-for="(cat, idx) in homeCategories" :key="idx" class="space-y-3">
          <h2 class="text-xl font-bold text-slate-100 flex items-center gap-2">
            {{ cat.title }}
          </h2>
          <!-- Vízszintesen görgethető csempék -->
          <div class="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700">
            <div 
              v-for="item in cat.items" 
              :key="item.id"
              @click="selectItem(item)"
              class="flex-none w-36 sm:w-44 group cursor-pointer transition transform hover:-translate-y-2"
            >
              <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-800 border border-slate-800 group-hover:border-rose-500 transition shadow-lg">
                <img 
                  v-if="item.poster_path" 
                  :src="`${IMAGE_BASE_URL}${item.poster_path}`" 
                  :alt="item.title || item.name" 
                  class="w-full h-full object-cover"
                />
                <div class="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md text-amber-400 font-bold text-xs px-1.5 py-0.5 rounded border border-amber-500/30">
                  ★ {{ item.vote_average?.toFixed(1) }}
                </div>
              </div>
              <p class="mt-2 text-sm font-medium text-slate-300 group-hover:text-rose-400 line-clamp-1 transition">
                {{ item.title || item.name }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. HANGULAT ALAPÚ KERESŐ -->
      <div v-if="currentTab === 'mood'" class="flex flex-col items-center">
        <!-- Hangulat gombok -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
          <button
            v-for="mood in MOODS"
            :key="mood.id"
            @click="handleMoodSearch(mood.id)"
            :class="[
              'p-4 rounded-xl border text-left transition transform hover:-translate-y-1',
              selectedMood === mood.id ? 'border-rose-500 bg-slate-800/90 shadow-lg shadow-rose-950' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
            ]"
          >
            <div class="font-bold text-base text-slate-100">{{ mood.label }}</div>
            <div class="text-xs text-slate-400 mt-1">{{ mood.description }}</div>
          </button>
        </div>

        <!-- Töltés -->
        <div v-if="loading" class="my-12 text-rose-500 flex items-center gap-2">
          <RefreshCw class="animate-spin" :size="24" /> Keresés...
        </div>

        <!-- Kártya Megjelenítés -->
        <div v-if="moodRecommendation && !loading" class="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden max-w-2xl w-full shadow-2xl flex flex-col md:flex-row">
          <img 
            v-if="moodRecommendation.poster_path" 
            :src="`${IMAGE_BASE_URL}${moodRecommendation.poster_path}`" 
            class="w-full md:w-56 object-cover h-80 md:h-auto" 
          />
          <div class="p-6 flex flex-col justify-between flex-1">
            <div>
              <div class="flex justify-between items-start">
                <h2 class="text-2xl font-bold text-white">{{ moodRecommendation.title || moodRecommendation.name }}</h2>
                <span class="bg-amber-500/20 text-amber-400 font-bold px-2 py-1 rounded text-sm border border-amber-500/30">
                  ★ {{ moodRecommendation.vote_average?.toFixed(1) }}
                </span>
              </div>
              <p class="text-slate-300 text-sm mt-3 line-clamp-4">{{ moodRecommendation.overview || 'Nincs leírás.' }}</p>
            </div>

            <!-- Hol nézhető -->
            <div class="mt-6 pt-4 border-t border-slate-800">
              <span class="text-xs font-semibold text-slate-400 block mb-2">ELÉRHERŐ ITT:</span>
              <div class="flex flex-wrap gap-2">
                <template v-if="providers?.flatrate">
                  <img v-for="p in providers.flatrate" :key="p.provider_id" :src="`${IMAGE_BASE_URL}${p.logo_path}`" :title="p.provider_name" class="w-8 h-8 rounded-lg" />
                </template>
                <span v-else class="text-xs text-slate-500">Nincs streaming információ.</span>
              </div>
            </div>

            <button v-if="selectedMood" @click="handleMoodSearch(selectedMood)" class="mt-6 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-sm transition">
              <RefreshCw :size="16" /> Másikat kérek
            </button>
          </div>
        </div>
      </div>

      <!-- 3. FILM-RULETT SZERENCSEKERÉK -->
      <div v-if="currentTab === 'roulette'" class="flex flex-col items-center justify-center text-center py-8">
        <h2 class="text-3xl font-extrabold text-white mb-2">Film-Rulett 🎰</h2>
        <p class="text-slate-400 text-sm mb-8">Bízd a sorsra az esti mozizást!</p>

        <button 
          @click="spinRoulette" 
          :disabled="isSpinning"
          class="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-lg px-8 py-4 rounded-2xl shadow-xl shadow-rose-950/50 flex items-center gap-3 transition transform active:scale-95 disabled:opacity-50 cursor-pointer mb-8"
        >
          <Dices :class="{'animate-spin': isSpinning}" :size="28" />
          <span>{{ isSpinning ? 'Pörög a kerék...' : 'Pörgetés!' }}</span>
        </button>

        <!-- Pörgetés eredménye -->
        <div v-if="rouletteResult && !isSpinning" class="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden max-w-xl w-full shadow-2xl flex flex-col md:flex-row text-left">
          <img 
            v-if="rouletteResult.poster_path" 
            :src="`${IMAGE_BASE_URL}${rouletteResult.poster_path}`" 
            class="w-full md:w-48 object-cover h-72 md:h-auto" 
          />
          <div class="p-6 flex flex-col justify-between flex-1">
            <div>
              <h3 class="text-xl font-bold text-white">{{ rouletteResult.title || rouletteResult.name }}</h3>
              <p class="text-slate-300 text-xs mt-2 line-clamp-3">{{ rouletteResult.overview || 'Nincs leírás.' }}</p>
            </div>
            <!-- Hol nézhető -->
            <div class="mt-4 pt-3 border-t border-slate-800">
              <span class="text-xs font-semibold text-slate-400 block mb-1">ELÉRHERŐ ITT:</span>
              <div class="flex flex-wrap gap-2">
                <template v-if="providers?.flatrate">
                  <img v-for="p in providers.flatrate" :key="p.provider_id" :src="`${IMAGE_BASE_URL}${p.logo_path}`" :title="p.provider_name" class="w-7 h-7 rounded-lg" />
                </template>
                <span v-else class="text-xs text-slate-500">Nincs streaming infó.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>