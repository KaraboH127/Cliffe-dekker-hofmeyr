// Import the shared Sanity client configuration.
import client from "./sanityClient.js";

// Query all blog posts and include title, body content, author, categories, and optional images.
const POSTS_QUERY = `*[_type == "post"] | order(coalesce(publishedAt, _createdAt) desc) {
  _id,
  title,
  "slug": slug.current,
  "publishedAt": coalesce(publishedAt, _createdAt),
  "author": author->name,
  "categories": categories[]->title,
  "mainImageUrl": mainImage.asset->url,
  "mainImageAlt": coalesce(mainImage.alt, title),
  body[]{
    ...,
    _type == "image" => {
      ...,
      "url": asset->url,
      "alt": coalesce(alt, "")
    }
  }
}`;

// Cache core page elements so rendering and events are fast and predictable.
const articlesContainer = document.getElementById("articles");
const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
const newsletterForm = document.getElementById("newsletterForm");

let allPosts = [];
let activeFilter = "all";

// Portable Text style mapping to HTML tags.
const BLOCK_STYLE_TAGS = {
  normal: "p",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  blockquote: "blockquote",
};

// Basic escaping to prevent broken HTML output when rendering content.
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Keep links safe when rendering inline URL annotations from Portable Text.
function sanitizeUrl(value) {
  if (!value) return "#";
  try {
    const parsed = new URL(value, window.location.origin);
    const allowedProtocols = ["http:", "https:", "mailto:", "tel:"];
    return allowedProtocols.includes(parsed.protocol) ? parsed.href : "#";
  } catch {
    return "#";
  }
}

// Convert inline marks like strong/em/link to valid HTML wrappers.
function applyMarks(text, marks = [], markDefs = []) {
  return marks.reduce((currentText, mark) => {
    switch (mark) {
      case "strong":
        return `<strong>${currentText}</strong>`;
      case "em":
        return `<em>${currentText}</em>`;
      case "underline":
        return `<u>${currentText}</u>`;
      case "code":
        return `<code>${currentText}</code>`;
      case "strike":
      case "strike-through":
        return `<s>${currentText}</s>`;
      default: {
        const annotation = markDefs.find((def) => def && def._key === mark);
        if (annotation?._type === "link") {
          const href = sanitizeUrl(annotation.href);
          return `<a href="${href}" target="_blank" rel="noopener noreferrer">${currentText}</a>`;
        }
        return currentText;
      }
    }
  }, text);
}

// Render Sanity Portable Text to semantic HTML with paragraphs, lists, headings, and inline formatting.
function renderPortableText(blocks = []) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return "<p>No article content available.</p>";
  }

  let html = "";
  let currentListTag = null;

  const closeList = () => {
    if (currentListTag) {
      html += `</${currentListTag}>`;
      currentListTag = null;
    }
  };

  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;

    if (block._type === "image" && block.url) {
      closeList();
      const alt = escapeHtml(block.alt || "Article image");
      html += `<figure class="portable-image"><img src="${escapeHtml(block.url)}" alt="${alt}" loading="lazy"></figure>`;
      continue;
    }

    if (block._type !== "block" || !Array.isArray(block.children)) continue;

    const markDefs = Array.isArray(block.markDefs) ? block.markDefs : [];
    const inlineHtml = block.children
      .map((child) => {
        if (!child || child._type !== "span") return "";
        const safeText = escapeHtml(child.text || "");
        const marks = Array.isArray(child.marks) ? child.marks : [];
        return applyMarks(safeText, marks, markDefs);
      })
      .join("");

    if (!inlineHtml.trim()) continue;

    if (block.listItem) {
      const listTag = block.listItem === "number" ? "ol" : "ul";
      if (currentListTag !== listTag) {
        closeList();
        currentListTag = listTag;
        html += `<${currentListTag}>`;
      }
      html += `<li>${inlineHtml}</li>`;
      continue;
    }

    closeList();
    const style = block.style || "normal";
    const tag = BLOCK_STYLE_TAGS[style] || "p";
    html += `<${tag}>${inlineHtml}</${tag}>`;
  }

  closeList();
  return html || "<p>No article content available.</p>";
}

// Extract the first image from the body for cases where mainImage is not set.
function getFirstBodyImageUrl(blocks = []) {
  const imageBlock = Array.isArray(blocks)
    ? blocks.find((block) => block?._type === "image" && block.url)
    : null;
  return imageBlock?.url || "";
}

// Normalize a category label so button filters work with Sanity category titles.
function normalizeCategory(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Map Sanity posts into a predictable shape for rendering.
function normalizePost(post) {
  const categories = Array.isArray(post?.categories)
    ? post.categories.filter(Boolean)
    : [];

  return {
    id: post?._id || `post-${Math.random().toString(36).slice(2)}`,
    title: post?.title || "Untitled article",
    body: Array.isArray(post?.body) ? post.body : [],
    publishedAt: post?.publishedAt || null,
    author: post?.author || "CDH Editorial",
    categories,
    mainImageUrl: post?.mainImageUrl || getFirstBodyImageUrl(post?.body),
    mainImageAlt: post?.mainImageAlt || post?.title || "Article image",
  };
}

// Choose which posts should be shown for the active filter selection.
function matchesFilter(post, filterValue) {
  if (filterValue === "all") return true;

  const normalizedFilter = normalizeCategory(filterValue);
  const normalizedCategories = post.categories.map(normalizeCategory);

  if (normalizedFilter === "banking") {
    return normalizedCategories.some((category) => category.includes("bank"));
  }

  return normalizedCategories.some((category) => category.includes(normalizedFilter));
}

// Format publish date for human-readable display.
function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Pick a display-ready category label for each post card.
function getPrimaryCategory(post) {
  return post.categories[0] || "General";
}

// Render a status message for loading, empty, or error states.
function renderStatus(message) {
  if (!articlesContainer) return;
  articlesContainer.innerHTML = `<p class="articles-message">${escapeHtml(message)}</p>`;
}

// Build one article card with title, meta, optional image, and rendered Portable Text body.
function createArticleMarkup(post) {
  const imageSection = post.mainImageUrl
    ? `
      <div class="blog-image">
        <img src="${escapeHtml(post.mainImageUrl)}" alt="${escapeHtml(post.mainImageAlt)}" loading="lazy">
        <span class="blog-category">${escapeHtml(getPrimaryCategory(post))}</span>
      </div>
    `
    : "";

  const bodyHtml = renderPortableText(post.body);

  return `
    <article class="blog-card">
      ${imageSection}
      <div class="blog-content">
        <h3>${escapeHtml(post.title)}</h3>
        <div class="blog-meta">
          <span class="blog-date"><i class="fas fa-calendar"></i> ${escapeHtml(formatDate(post.publishedAt))}</span>
          <span class="blog-author"><i class="fas fa-user"></i> ${escapeHtml(post.author)}</span>
        </div>
        <div class="portable-text">${bodyHtml}</div>
      </div>
    </article>
  `;
}

// Render posts into the shared #articles container, including "No articles found" fallback.
function renderArticles(posts) {
  if (!articlesContainer) return;

  const filteredPosts = posts.filter((post) => matchesFilter(post, activeFilter));
  if (filteredPosts.length === 0) {
    renderStatus("No articles found.");
    return;
  }

  articlesContainer.innerHTML = filteredPosts.map(createArticleMarkup).join("");
}

// Wire up category filter buttons (if present on the current page).
function setupFilters() {
  if (!filterButtons.length) return;

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      activeFilter = button.dataset.filter || "all";
      renderArticles(allPosts);
    });
  });
}

// Keep existing newsletter behavior for the blog page.
function setupNewsletterForm() {
  if (!newsletterForm) return;

  newsletterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const emailField = newsletterForm.querySelector('input[type="email"]');
    const email = emailField?.value?.trim();
    if (!email) return;

    alert(`Thank you for subscribing with ${email}! Check your inbox for a confirmation.`);
    newsletterForm.reset();
  });
}

// Fetch posts from Sanity and trigger rendering with full error handling.
async function loadArticles() {
  if (!articlesContainer) {
    return;
  }

  renderStatus("Loading articles...");

  try {
    const posts = await client.fetch(POSTS_QUERY);
    allPosts = Array.isArray(posts) ? posts.map(normalizePost) : [];

    if (allPosts.length === 0) {
      renderStatus("No articles found.");
      return;
    }

    renderArticles(allPosts);
  } catch (error) {
    console.error("Failed to load articles from Sanity:", error);
    renderStatus("Unable to load articles right now. Please try again later.");
  }
}

// Initialize page behavior for filters, newsletter, and dynamic article loading.
setupFilters();
setupNewsletterForm();
loadArticles();
