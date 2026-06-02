import { useState, useEffect, useRef } from "react";
import { supabase, PUBLIC_VIDEO_COLUMNS } from "@/lib/supabase";
import type { Video, Category } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedVideos from "@/components/FeaturedVideos";
import VideoGallery from "@/components/VideoGallery";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";
import VideoModal from "@/components/VideoModal";
import Footer from "@/components/Footer";

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const galleryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    async function fetchData() {
      const [videosRes, categoriesRes] = await Promise.all([
        // Explicit column list — never fetches project_password for public users
        supabase.from("videos").select(PUBLIC_VIDEO_COLUMNS).order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name, slug").order("name"),
      ]);
      if (videosRes.data) setVideos(videosRes.data as Video[]);
      if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  const featuredVideos = videos.filter((v) => v.featured);

  function scrollToGallery() {
    galleryRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <Hero onExplore={scrollToGallery} />
      <FeaturedVideos videos={featuredVideos} onPlay={setSelectedVideo} loading={loading} />
      <section ref={galleryRef as React.RefObject<HTMLElement>}>
        <VideoGallery
          videos={videos}
          categories={categories}
          onPlay={setSelectedVideo}
          loading={loading}
        />
      </section>
      <AboutSection />
      <ContactSection />
      <Footer />
      {selectedVideo && (
        <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </div>
  );
}
