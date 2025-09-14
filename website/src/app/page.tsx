"use client";

import { useEffect, useRef, useState } from "react";

// Navigation Component
function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md border-b border-[var(--border-color)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center space-x-3">
            <img src="/applogo.png" alt="AIbnb Logo" className="w-8 h-8" />
            <span className="text-2xl font-bold text-[var(--primary-orange)]">
              AIbnb
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {["About", "Plan", "Contact Us"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-[var(--text-primary)] hover:text-[var(--primary-orange)] px-3 py-2 text-sm font-medium transition-colors duration-200 relative group"
                >
                  {item}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--primary-orange)] transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[var(--text-primary)] hover:text-[var(--primary-orange)] focus:outline-none focus:text-[var(--primary-orange)]"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-md rounded-lg mt-2 border border-[var(--border-color)]">
              {["About", "Plan", "Contact Us"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-[var(--text-primary)] hover:text-[var(--primary-orange)] block px-3 py-2 text-base font-medium transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Background Motion Component
function BackgroundMotion() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-top)] to-[var(--bg-bottom)]"></div>

      {/* Floating dots */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[var(--primary-orange)] rounded-full opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Drifting shapes */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-[var(--soft-orange)] rounded-full opacity-20 animate-drift"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
      </div>
    </div>
  );
}

// Search Bar Component
function SearchBar({
  onHover,
  onLeave,
  onClick,
  isModalOpen,
}: {
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  isModalOpen: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div
        className={`relative bg-white border border-[var(--border-color)] rounded-2xl shadow-lg transition-all duration-300 ${
          isHovered || isModalOpen
            ? "scale-[1.01] shadow-[0_12px_28px_var(--orange-glow-strong)]"
            : "shadow-[0_8px_20px_var(--orange-glow)]"
        } ${
          isFocused ? "shadow-[0_12px_28px_var(--orange-glow-strong)]" : ""
        } animate-glow-pulse`}
        onMouseEnter={() => {
          setIsHovered(true);
          onHover();
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          // Only close modal if it's not already open and user is not interacting with it
          if (!isModalOpen) {
            onLeave();
          }
        }}
        onClick={onClick}
      >
        <div className="flex items-center px-4 py-3">
          {/* Search Icon */}
          <svg
            className="w-5 h-5 text-[var(--placeholder-text)] mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* Input */}
          <input
            type="text"
            placeholder="So where are we going today? ✈️"
            className="flex-1 text-base font-semibold text-[var(--text-primary)] placeholder-[var(--placeholder-text)] bg-transparent border-none outline-none"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            readOnly
          />
        </div>
      </div>
    </div>
  );
}

// Modal Component
function ComingSoonModal({
  isOpen,
  onClose,
  onUserInteract,
  onShowToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUserInteract?: () => void;
  onShowToast?: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [isValid, setIsValid] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setIsValid(false);
      return;
    }
    setIsValid(true);

    // Fake analytics event
    console.log("Waitlist signup:", email);

    // Show toast and close modal
    onShowToast?.(
      "Thanks! You're on the waitlist. We'll notify you when AIbnb launches!"
    );
    setEmail("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onMouseEnter={() => onUserInteract?.()}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl border border-[var(--border-color)] shadow-[0_24px_40px_var(--shadow-strong)] max-w-md w-full p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onMouseEnter={() => onUserInteract?.()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-sub)] hover:text-[var(--text-primary)] transition-colors duration-200 p-1"
          aria-label="Close modal"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2
          id="modal-title"
          className="text-2xl font-extrabold text-[var(--text-primary)] mb-2"
        >
          Coming soon
        </h2>
        <p className="text-[var(--text-sub)] text-sm mb-6">
          Be first to try AIbnb when we open
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setIsValid(true);
              }}
              placeholder="Enter your email"
              className={`w-full px-4 py-3 rounded-xl border ${
                isValid ? "border-[var(--border-color)]" : "border-red-300"
              } focus:border-[var(--primary-orange)] focus:outline-none transition-colors`}
              aria-label="Email address"
              required
            />
            {!isValid && (
              <p className="text-red-500 text-sm mt-1">
                Please enter a valid email address
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[var(--primary-orange)] text-white font-semibold py-3.5 px-4.5 rounded-2xl hover:shadow-[0_8px_20px_var(--orange-glow)] transition-all duration-200 active:scale-95"
          >
            Join waitlist
          </button>
        </form>

        <p className="text-xs text-[var(--text-sub)] mt-4 text-center">
          By joining you agree to receive occasional product updates.{" "}
          <a
            href="/privacy"
            className="text-[var(--primary-orange)] hover:underline"
          >
            Privacy
          </a>
        </p>
      </div>
    </div>
  );
}

// Hero Component
function Hero({ onShowToast }: { onShowToast: (message: string) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const handleSearchHover = () => {
    if (
      typeof window !== "undefined" &&
      window.innerWidth >= 768 &&
      !isUserInteracting
    ) {
      setIsModalOpen(true);
    }
  };

  const handleSearchLeave = () => {
    if (
      typeof window !== "undefined" &&
      window.innerWidth >= 768 &&
      !isUserInteracting
    ) {
      // Add a small delay to prevent flinching when moving to modal
      setTimeout(() => {
        if (!isUserInteracting) {
          setIsModalOpen(false);
        }
      }, 100);
    }
  };

  const handleSearchClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsModalOpen(true);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="text-center max-w-4xl mx-auto">
        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-[var(--text-primary)] mb-6 tracking-tight">
          Book your next vacation
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-[var(--text-sub)] mb-12 font-medium max-w-2xl mx-auto">
          Tell me where, how long, who is coming and your vibe
        </p>

        {/* Search Bar */}
        <div className="mb-16">
          <SearchBar
            onHover={handleSearchHover}
            onLeave={handleSearchLeave}
            onClick={handleSearchClick}
            isModalOpen={isModalOpen}
          />

          {/* Mobile tooltip */}
          <p className="text-sm text-[var(--text-sub)] mt-4 md:hidden">
            Tap to join our waitlist
          </p>
        </div>

        {/* Trust Badge */}
        <div className="flex items-center justify-center space-x-2 text-sm text-[var(--text-sub)]">
          <div className="w-2 h-2 bg-[var(--primary-orange)] rounded-full"></div>
          <span>
            A plan preview in seconds • No sign in needed to try when it
            launches
          </span>
        </div>
      </div>

      {/* Modal */}
      <ComingSoonModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsUserInteracting(false);
        }}
        onUserInteract={() => setIsUserInteracting(true)}
        onShowToast={onShowToast}
      />
    </section>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="relative bg-white/50 backdrop-blur-sm border-t border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-[var(--text-sub)]">
            © 2024 AIbnb. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a
              href="/privacy"
              className="text-sm text-[var(--text-sub)] hover:text-[var(--primary-orange)] transition-colors"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="text-sm text-[var(--text-sub)] hover:text-[var(--primary-orange)] transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Toast Component
function Toast({
  message,
  isVisible,
  onClose,
}: {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-checkmark">
      <div className="bg-white border border-[var(--border-color)] rounded-xl shadow-[0_24px_40px_var(--shadow-strong)] p-4 flex items-center space-x-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <span className="text-[var(--text-primary)] font-medium">
          {message}
        </span>
        <button
          onClick={onClose}
          className="text-[var(--text-sub)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Main Page Component
export default function Home() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  return (
    <div className="relative min-h-screen">
      <BackgroundMotion />
      <Navigation />
      <Hero
        onShowToast={(message) => {
          setToastMessage(message);
          setShowToast(true);
        }}
      />
      <Footer />
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
