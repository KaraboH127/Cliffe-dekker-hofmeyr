// Blog data
const blogPosts = [
    {
        id: 1,
        title: "CDH advised SuperSport International (Pty) Ltd",
        category: "corporate",
        date: "Feb 20, 2026",
        author: "John Smith",
        excerpt: "CDH advised SuperSport International (Pty) Ltd on the recent sale of its Premier Soccer League football club, SuperSport United, to Siwelele FC (Pty) Ltd.",
        image: "../images/articles-p1.jpg",
        link: "../pages-articles/article-1.html"
    },
    {
        id: 2,
        title: "CDH acted as legal adviser to a consortium comprising WIPHOLD, Phatisa Food Fund 3, PIC and IDC",
        category: "Banking",
        date: "Feb 15, 2026",
        author: "Sarah Johnson",
        excerpt: "CDH acted as legal adviser to a consortium comprising WIPHOLD, Phatisa Food Fund 3, PIC and IDC on the acquisition of the Zaad Group from Zeder Financial Services and other minority shareholders.",
        image: "../images/Articles-p2.jpg",
        link: "../pages-articles/article-2.html"
    },
    {
        id: 3,
        title: "The CDH Oil & Gas sector team is pleased to announce that it advised Eco Atlantic Oil & Gas on its strategic partnership with Navitas",
        category: "environmental",
        date: "Jan 10, 2026",
        author: "Michael Brown",
        excerpt: "The CDH Oil & Gas sector team is pleased to announce that it advised Eco Atlantic on its strategic partnership with Navitas Petroleum LP (Navitas).",
        image: "../images/Articles-p3.jpg",
        link: "../pages-articles/article-3.html"
    },
    {
        id: 4,
        title: "CDH advised Vodacom in its transformative acquisition of a 30% stake in MAZIV",
        category: "competition",
        date: "Aug 5, 2025",
        author: "Emma Davis",
        excerpt: "CDH advised Vodacom in its transformative acquisition of a 30% stake in MAZIV, the holder of Vumatel and Dark Fibre Africa, including the vending into MAZIV of Vodacom's fibre to the home (FTTH) business and certain additional assets (including fibre to the business, metropolitan backhaul fibre, access, core, and transmission assets).",
        image: "../images/articles-p4.jpg",
        link: "../pages-articles/article-4.html"
    },
    {
        id: 5,
        title: "Protecting Dignity in the Workplace: Court reinforces employers' duties in sexual harassment claims",
        category: "employment",
        date: "Oct 16, 2024",
        author: "Tshepo Mashaba",
        excerpt: "The Employment and Labour Relations Court in Faith Viloko v Grand CafÃ© Indian Cuisine & Another [2025] KEELRC 2688 (2 October 2025) (Judgment) has reaffirmed that sexual harassment in...",
        image: "../images/articles-p5.jpg",
        link: "../pages-articles/article-5.html"
    },
    {
        id: 6,
        title: "Whose international customary law applies?",
        category: "employment",
        date: "May 6, 2025",
        author: "Piet Rossi",
        excerpt: "The first genocide of the 20th century, perpetuated against the OvaHerero and Nama peoples in what is now Namibia, remains unresolved in international and domestic courts. The communities...",
        image: "../images/article-p6.jpg",
        link: "../pages-articles/article-6.html"
    }
];

// DOM Elements
const blogGrid = document.getElementById('blogGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const newsletterForm = document.getElementById('newsletterForm');

// Render blog posts
function renderBlogPosts(postsToRender) {
    blogGrid.innerHTML = '';
    
    postsToRender.forEach(post => {
        const blogCard = document.createElement('article');
        blogCard.className = 'blog-card';
        blogCard.innerHTML = `
            <div class="blog-image">
                <img src="${post.image}" alt="${post.title}" />
                <span class="blog-category">${capitalizeCategory(post.category)}</span>
            </div>
            <div class="blog-content">
                <h3>${post.title}</h3>
                <div class="blog-meta">
                    <span class="blog-date">
                        <i class="fas fa-calendar"></i> ${post.date}
                    </span>
                    <span class="blog-author">
                        <i class="fas fa-user"></i> ${post.author}
                    </span>
                </div>
                <p>${post.excerpt}</p>
                <a href="${post.link}" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
            </div>
        `;
        blogGrid.appendChild(blogCard);
    });
}

// Filter functionality
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const filter = button.getAttribute('data-filter');
        const filtered = filter === 'all' 
            ? blogPosts 
            : blogPosts.filter(post => post.category === filter);
        
        renderBlogPosts(filtered);
    });
});

// Newsletter form submission
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;
        
        // Here you would typically send the email to your backend
        alert(`Thank you for subscribing with ${email}! Check your inbox for a confirmation.`);
        newsletterForm.reset();
    });
}

// Capitalize category names
function capitalizeCategory(category) {
    const categories = {
        corporate: "Corporate Law",
        employment: "Employment Law",
        environmental: "Environmental Law",
        competition: "Competition Law",
        Banking: "Banking, Finance & Projects"
    };
    return categories[category] || category;
}

// Initial render
renderBlogPosts(blogPosts);
