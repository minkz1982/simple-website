var CATALOG_URL  = "https://catalog.roproxy.com/v1/search/items/details";
var ASSET_THUMB  = "https://thumbnails.roproxy.com/v1/assets";
var BUNDLE_THUMB = "https://thumbnails.roproxy.com/v1/bundles/thumbnails";

var allItems      = [];
var nextCursor    = "";
var isFetching    = false;
var currentFilter = "All";
var searchQuery   = "";

async function fetchThumbnails(raw) {
  var assetIds  = raw.filter(function(i){ return i.itemType === "Asset";  }).map(function(i){ return i.id; });
  var bundleIds = raw.filter(function(i){ return i.itemType === "Bundle"; }).map(function(i){ return i.id; });

  var thumbMap = {};

  var reqs = [];

  if (assetIds.length) {
    reqs.push(
      fetch(ASSET_THUMB + "?assetIds=" + assetIds.join(",") + "&size=420x420&format=Png&returnPolicy=PlaceHolder")
        .then(function(r){ return r.ok ? r.json() : { data: [] }; })
        .then(function(d){
          (d.data || []).forEach(function(t){
            if (t.state === "Completed") thumbMap[t.targetId] = t.imageUrl;
          });
        })
        .catch(function(){})
    );
  }

  if (bundleIds.length) {
    reqs.push(
      fetch(BUNDLE_THUMB + "?bundleIds=" + bundleIds.join(",") + "&size=420x420&format=Png")
        .then(function(r){ return r.ok ? r.json() : { data: [] }; })
        .then(function(d){
          (d.data || []).forEach(function(t){
            if (t.state === "Completed") thumbMap[t.targetId] = t.imageUrl;
          });
        })
        .catch(function(){})
    );
  }

  await Promise.all(reqs);
  return thumbMap;
}

async function fetchUGC(cursor) {
  if (isFetching) return;
  isFetching = true;

  var loadBtn = document.getElementById("loadMoreBtn");
  loadBtn.style.display = "none";

  if (!cursor) {
    document.getElementById("items").innerHTML =
      '<div class="loading-state"><div class="spinner"></div><p>Loading items from Roblox...</p></div>';
  }

  try {
    var url = CATALOG_URL + "?limit=30" + (cursor ? "&cursor=" + encodeURIComponent(cursor) : "");
    var res  = await fetch(url);

    if (!res.ok) {
      var errBody = await res.text();
      throw new Error("API " + res.status + ": " + errBody);
    }

    var data    = await res.json();
    var raw     = data.data || [];
    nextCursor  = data.nextPageCursor || "";

    if (raw.length === 0) {
      if (allItems.length === 0) {
        document.getElementById("items").innerHTML =
          '<div class="loading-state"><p>No items found. Try refreshing!</p></div>';
      }
      return;
    }

    var thumbMap = await fetchThumbnails(raw);

    var mapped = raw.map(function(item) {
      var isFree = item.price == null || item.price === 0;
      var image  = thumbMap[item.id] || "https://placehold.co/420x420/111124/6bdbff?text=RBX";
      return {
        id:      item.id,
        name:    item.name          || "Unknown Item",
        creator: item.creatorName   || "Roblox",
        price:   isFree ? "Free" : item.price + " R$",
        isFree:  isFree,
        image:   image,
        type:    item.itemType      || "Asset"
      };
    });

    allItems = allItems.concat(mapped);
    renderItems();

    loadBtn.style.display = nextCursor ? "inline-block" : "none";

  } catch (err) {
    console.error("fetchUGC error:", err);
    if (allItems.length === 0) {
      document.getElementById("items").innerHTML =
        '<div class="loading-state"><p>⚠️ Failed to load items. The Roblox proxy may be temporarily down — please refresh and try again.</p></div>';
    }
    showToast("⚠️ Could not load items. Please refresh.");
  } finally {
    isFetching = false;
  }
}

function getFiltered() {
  return allItems.filter(function(item) {
    var fMatch =
      currentFilter === "All"    ||
      (currentFilter === "Free"   && item.isFree)             ||
      (currentFilter === "Asset"  && item.type === "Asset")   ||
      (currentFilter === "Bundle" && item.type === "Bundle");

    var q = searchQuery.toLowerCase();
    var sMatch = item.name.toLowerCase().includes(q) ||
                 item.creator.toLowerCase().includes(q);

    return fMatch && sMatch;
  });
}

function badgeClass(item) {
  if (item.isFree)            return "badge-free";
  if (item.type === "Bundle") return "badge-bundle";
  return "badge-asset";
}

function badgeLabel(item) {
  if (item.isFree)            return "🎁 Free";
  if (item.type === "Bundle") return "📦 Bundle";
  return "🎩 Asset";
}

function renderItems() {
  var container = document.getElementById("items");
  if (!container) return;
  container.innerHTML = "";

  var list = getFiltered();

  if (list.length === 0) {
    container.innerHTML =
      '<div class="loading-state"><p>Nothing matches — try a different search!</p></div>';
    return;
  }

  list.forEach(function(item) {
    var card = document.createElement("div");
    card.className = "item-card";
    card.title = "View on Roblox";
    card.onclick = function() {
      window.open("https://www.roblox.com/catalog/" + item.id, "_blank");
    };
    card.innerHTML =
      '<div class="img-wrap">' +
        '<img src="' + item.image + '" alt="' + item.name + '" loading="lazy" ' +
          'onerror="this.src=\'https://placehold.co/420x420/111124/6bdbff?text=RBX\'">' +
      '</div>' +
      '<div class="card-info">' +
        '<span class="item-badge ' + badgeClass(item) + '">' + badgeLabel(item) + '</span>' +
        '<div class="item-name">' + item.name + '</div>' +
        '<div class="item-creator">by ' + item.creator + '</div>' +
        '<div class="item-price' + (item.isFree ? " free" : "") + '">' + item.price + '</div>' +
      '</div>';
    container.appendChild(card);
  });
}

function showToast(msg) {
  var t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.style.opacity = "0"; }, 3500);
}

document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll(".filter-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      document.querySelectorAll(".filter-btn").forEach(function(b){ b.classList.remove("active"); });
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderItems();
    });
  });

  var input = document.getElementById("searchInput");
  if (input) {
    input.addEventListener("input", function() {
      searchQuery = input.value.trim();
      renderItems();
    });
  }

  document.getElementById("loadMoreBtn").addEventListener("click", function() {
    fetchUGC(nextCursor);
  });

  fetchUGC();
});
