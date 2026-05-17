import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCommunityPosts } from "../../api/communityApi.js";
import Container from "../layout/Container.jsx";
import SectionWrapper from "../layout/SectionWrapper.jsx";

const CommunityHighlightsSection = () => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const res = await getCommunityPosts();
        // Take the top 3 latest published posts
        if (res.data && Array.isArray(res.data)) {
          setHighlights(res.data.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to load community highlights for homepage:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();
  }, []);

  if (loading) {
    return (
      <SectionWrapper id="highlights" className="bg-[#030812] py-24 text-center">
        <Container>
          <div className="text-slate-400">Loading club highlights...</div>
        </Container>
      </SectionWrapper>
    );
  }

  if (highlights.length === 0) {
    return null; // Don't show the section if there are no highlights published
  }

  return (
    <SectionWrapper id="highlights" className="relative overflow-hidden bg-[#030812] py-24 border-t border-white/5">
      {/* Decorative gradient glowing orb */}
      <div className="pointer-events-none absolute -right-40 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[#40e0d0]/5 blur-[120px]" />

      <Container className="relative z-10">
        
        {/* Header Title */}
        <div className="mb-16 text-center">
          <h2 className="text-xs font-black uppercase tracking-[0.25em] text-[#40e0d0]">
            Club Chronicles
          </h2>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Community Spotlight
          </p>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
            Relive event achievements, athlete stories, and exclusive club announcements.
          </p>
        </div>

        {/* Highlights Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((post) => (
            <article
              key={post._id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#081121]/40 backdrop-blur-md transition hover:border-[#40e0d0]/20 hover:bg-[#0a152a]/60"
            >
              {/* Cover Aspect Ratio Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                <img
                  src={post.coverImage || "/placeholder.jpg"}
                  alt={post.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                
                {/* Category Pill Tag */}
                <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#40e0d0] backdrop-blur-md border border-white/10">
                  {post.category}
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                  <span>{post.author}</span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>

                <h3 className="mt-3 text-xl font-bold text-white transition group-hover:text-[#40e0d0] line-clamp-2">
                  {post.title}
                </h3>

                <p className="mt-2 text-sm text-slate-400 line-clamp-3">
                  {post.description}
                </p>

                {/* Read Action Footer */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-[#40e0d0]">
                  <Link to={`/community/${post.slug}`} className="flex items-center gap-1.5 hover:underline">
                    Read Story
                    <svg className="h-3 w-3 transition transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  {/* Quick counter details */}
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      👁️ {post.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      🔥 {post.likesCount || 0}
                    </span>
                  </div>
                </div>

              </div>
            </article>
          ))}
        </div>

        {/* View All CTA Link Button */}
        <div className="mt-16 text-center">
          <Link
            to="/community"
            className="inline-flex rounded-full bg-white/5 border border-white/10 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            Explore Community Feed
          </Link>
        </div>

      </Container>
    </SectionWrapper>
  );
};

export default CommunityHighlightsSection;
