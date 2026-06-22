import React, { useState } from 'react';
import {
  ArrowRight, CheckCircle2, Eye, Film, Box, Layers, Brain,
  Cpu, Target, Shield, Zap, TrendingUp, Users, Clock,
  Factory, Truck, ShoppingBag, Building2, Camera, Heart,
  Wheat, Bot, Lock, Sparkles, Play, ChevronRight,
  ArrowUpRight, Star, Menu, X, FileText, Code, BookOpen
} from 'lucide-react';
import { useAppStore } from '../store/appStore';

interface Props {
  onAuth: (mode: 'login' | 'register') => void;
  onEnterPlatform: () => void;
}

export default function PublicSite({ onAuth, onEnterPlatform }: Props) {
  const dm = useAppStore((s) => s.darkMode);
  const toggleDark = useAppStore((s) => s.toggleDark);
  const [showMenu, setShowMenu] = useState(false);

  const bg = dm ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900';
  const sectionBg = (alt = false) => alt ? (dm ? 'bg-slate-900/50' : 'bg-slate-50') : (dm ? 'bg-slate-950' : 'bg-white');
  const card = `rounded-2xl border ${dm ? 'bg-slate-900 border-slate-800 hover:border-slate-600' : 'bg-white border-slate-200 hover:shadow-xl'} transition-all duration-300`;
  const border = dm ? 'border-slate-800' : 'border-slate-200';

  const dataServices = [
    { icon: Eye, title: 'Image Annotation', desc: 'Bounding boxes, polygons, keypoints, and masks for 2D imagery' },
    { icon: Film, title: 'Video Annotation', desc: 'Object tracking, interpolation, and behavior labeling across frames' },
    { icon: Layers, title: 'Multi-Camera', desc: 'Synchronized multi-view annotation with shared track IDs' },
    { icon: Box, title: '3D Annotation', desc: 'Cuboid annotation and point cloud segmentation' },
    { icon: Brain, title: 'LiDAR Annotation', desc: 'Point cloud labeling with BEV visualization and sensor fusion' },
    { icon: Target, title: 'Point Cloud', desc: 'Dense point cloud segmentation and classification' },
    { icon: Heart, title: 'Medical Annotation', desc: 'Dicom-aware tools for organ and tissue segmentation' },
    { icon: Building2, title: 'Geospatial', desc: 'Satellite and aerial imagery annotation with GIS integration' },
    { icon: FileText, title: 'Document', desc: 'Layout, table, and field extraction for structured documents' },
    { icon: Code, title: 'OCR Annotation', desc: 'Text recognition and transcription with bounding regions' },
  ];

  const aiServices = [
    { icon: TrendingUp, title: 'Data Collection', desc: 'Custom data sourcing with demographic and geographic targeting' },
    { icon: Target, title: 'Data Labeling', desc: 'High-accuracy labeling with multi-pass QA verification' },
    { icon: Shield, title: 'Data Validation', desc: 'Automated and manual validation against ground truth' },
    { icon: Sparkles, title: 'Data Cleaning', desc: 'Deduplication, normalization, and quality filtering' },
    { icon: Layers, title: 'Dataset Management', desc: 'Versioned datasets with lineage tracking and rollbacks' },
    { icon: Cpu, title: 'Model Evaluation', desc: 'Benchmark models against curated eval sets with confusion analysis' },
    { icon: Brain, title: 'Synthetic Data', desc: 'Procedurally generated training data for edge case coverage' },
  ];

  const industries = [
    { icon: Truck, title: 'Autonomous Vehicles', desc: 'LiDAR, camera, radar fusion annotation for ADAS and AV training' },
    { icon: Factory, title: 'Warehouse & Logistics', desc: 'Object detection and tracking for fulfillment operations' },
    { icon: Bot, title: 'Manufacturing', desc: 'Defect detection, quality inspection, and assembly verification' },
    { icon: ShoppingBag, title: 'Retail Analytics', desc: 'Customer behavior tracking, shelf monitoring, and planogram compliance' },
    { icon: Building2, title: 'Smart Cities', desc: 'Traffic flow, pedestrian counting, and infrastructure monitoring' },
    { icon: Camera, title: 'Surveillance', desc: 'Security event detection, crowd analysis, and anomaly recognition' },
    { icon: Heart, title: 'Healthcare', desc: 'Medical imaging, pathology slides, and clinical document annotation' },
    { icon: Wheat, title: 'Agriculture', desc: 'Crop health, yield estimation, and drone imagery annotation' },
    { icon: Bot, title: 'Robotics', desc: 'Scene understanding, grasp point detection, and navigation mapping' },
    { icon: Lock, title: 'Security', desc: 'Biometric, access control, and threat detection datasets' },
  ];

  const annotationTypes = [
    { icon: Eye, title: '2D Annotation', examples: ['Bounding Boxes', 'Polygons', 'Polylines', 'Keypoints', 'Semantic Segmentation', 'Instance Segmentation'] },
    { icon: Film, title: 'Video Annotation', examples: ['Object Tracking', 'Multi-Object Tracking', 'Behavior Annotation', 'Activity Recognition', 'Frame Interpolation'] },
    { icon: Layers, title: 'Multi-Camera', examples: ['Cross-Camera Tracking', 'Shared Track IDs', 'Camera Synchronization', 'Multi-View Validation'] },
    { icon: Box, title: '3D Annotation', examples: ['Cuboids', 'Point Clouds', 'LiDAR Annotation', 'Sensor Fusion', 'BEV Visualization'] },
  ];

  const aiFeatures = [
    { icon: Cpu, title: 'Auto Bounding Boxes', desc: 'AI model detects and fits boxes to objects automatically' },
    { icon: Sparkles, title: 'Auto Segmentation', desc: 'One-click instance segmentation with boundary-accurate masks' },
    { icon: Brain, title: 'SAM2 Integration', desc: 'Meta Segment Anything Model 2 for zero-shot segmentation' },
    { icon: Film, title: 'Auto Tracking', desc: 'Object tracking across video frames with occlusion handling' },
    { icon: Target, title: 'Object Detection', desc: 'Pre-labeling with YOLO, DETR, and custom detection models' },
    { icon: TrendingUp, title: 'Track Prediction', desc: 'Predictive tracking for temporarily occluded objects' },
    { icon: Zap, title: 'Smart Suggestions', desc: 'Context-aware class and attribute predictions' },
  ];

  const pricing = [
    { name: 'Free Trial', price: '$0', period: '/14 days', desc: 'Explore the platform with limited data', features: ['Up to 1,000 images', '2D annotation tools', 'Basic QA checks', 'Community support'], cta: 'Start Free', highlight: false },
    { name: 'Professional', price: '$499', period: '/month', desc: 'For teams scaling annotation pipelines', features: ['Unlimited images', '2D + 3D + Video tools', 'Multi-camera support', 'Advanced QA engine', 'AI-assisted labeling', 'Priority support', '5 team members'], cta: 'Start Pro Trial', highlight: true },
    { name: 'Enterprise', price: 'Custom', period: '', desc: 'Full platform for production deployments', features: ['Everything in Professional', 'Unlimited team members', 'SSO & SAML', 'Custom AI models', 'Dedicated infrastructure', 'SLA & audit logs', 'API & webhooks', 'White-glove onboarding'], cta: 'Contact Sales', highlight: false },
  ];

  const stats = [
    { value: '500M+', label: 'Annotations Delivered' },
    { value: '99.2%', label: 'QA Accuracy' },
    { value: '10,000+', label: 'Annotators' },
    { value: '50+', label: 'Enterprise Clients' },
  ];

  const successStories = [
    { name: 'Autonomous Mobility Corp', industry: 'Autonomous Driving', quote: 'GV.AI reduced our annotation time by 60% while improving label accuracy. Their LiDAR and sensor fusion pipeline is unmatched.', author: 'VP of Data Operations', metric: '60% faster', color: 'from-blue-500 to-cyan-500' },
    { name: 'FulfillTech Robotics', industry: 'Warehouse & Logistics', quote: 'The multi-camera annotation with shared track IDs eliminated our duplicate track problem entirely. Production-ready quality.', author: 'Head of ML', metric: '99.8% accuracy', color: 'from-emerald-500 to-teal-500' },
    { name: 'MedScan Analytics', industry: 'Healthcare', quote: 'Their medical annotation tools with DICOM support transformed our pathology dataset pipeline. Best platform we have used.', author: 'CTO', metric: '3x throughput', color: 'from-rose-500 to-pink-500' },
  ];

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* Nav */}
      <header className={`sticky top-0 z-50 ${dm ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200'} backdrop-blur-xl border-b`}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-xs">GV</span>
            </div>
            <span className="font-bold text-base">GV.AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {['Services', 'Examples', 'Industries', 'AI Features', 'Pricing', 'Docs'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} className={`text-sm font-medium hover:text-blue-500 transition-colors ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggleDark} className={`p-2 rounded-lg ${dm ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              {dm ? '☀️' : '🌙'}
            </button>
            <button onClick={() => onAuth('login')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${dm ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'}`}>Login</button>
            <button onClick={() => onAuth('register')} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">Get Started</button>
            <button onClick={() => setShowMenu(!showMenu)} className="md:hidden p-2"><Menu size={18} /></button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={`relative overflow-hidden ${sectionBg()} border-b ${border}`}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 25% 50%, ${dm ? '#1e40af' : '#3b82f6'} 0%, transparent 50%), radial-gradient(circle at 75% 30%, ${dm ? '#0891b2' : '#06b6d4'} 0%, transparent 40%)` }} />
        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 text-xs font-medium mb-6 border border-blue-600/20">
              <Sparkles size={13} /> AI-Powered Annotation Platform
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              Annotate at enterprise scale with <span className="text-blue-500">production-grade accuracy</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 leading-relaxed opacity-70">
              The complete annotation platform for 2D images, video, 3D LiDAR, and multi-camera data. AI-assisted labeling, built-in QA validation, and configurable workflows for autonomous driving, robotics, and enterprise AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={onEnterPlatform} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]">
                Explore Live Demo <ArrowRight size={18} />
              </button>
              <button onClick={() => onAuth('register')} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium ${dm ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'} transition-all hover:scale-[1.02]`}>
                <Play size={18} /> Watch Overview
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-12">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl md:text-3xl font-bold text-blue-500">{s.value}</p>
                  <p className="text-xs md:text-sm opacity-60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className={`${sectionBg(true)} py-20 border-b ${border}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Data Annotation Services</h2>
            <p className="text-lg opacity-70">Professional annotation for every data modality</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {dataServices.map((s) => (
              <div key={s.title} className={`${card} p-5 group`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${dm ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'} group-hover:scale-110 transition-transform`}>
                  <s.icon size={20} />
                </div>
                <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                <p className={`text-xs leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mb-8 mt-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">AI Data Services</h2>
            <p className="text-lg opacity-70">End-to-end data pipeline management</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {aiServices.map((s) => (
              <div key={s.title} className={`${card} p-5`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${dm ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                  <s.icon size={18} />
                </div>
                <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                <p className={`text-xs leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className={`${sectionBg()} py-20 border-b ${border}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Industries We Serve</h2>
            <p className="text-lg opacity-70">Specialized annotation workflows for every domain</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {industries.map((ind) => (
              <div key={ind.title} className={`${card} p-4`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${dm ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                  <ind.icon size={16} />
                </div>
                <h3 className="font-semibold text-xs mb-1">{ind.title}</h3>
                <p className={`text-[10px] leading-relaxed ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{ind.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Examples */}
      <section id="examples" className={`${sectionBg(true)} py-20 border-b ${border}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Interactive Annotation Examples</h2>
            <p className="text-lg opacity-70">Explore live demonstrations of our annotation capabilities</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {annotationTypes.map((at) => (
              <div key={at.title} className={`${card} p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${dm ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <at.icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{at.title}</h3>
                    <p className={`text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{at.examples.length} annotation types</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {at.examples.map((ex) => (
                    <div key={ex} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${dm ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span className="text-xs">{ex}</span>
                    </div>
                  ))}
                </div>
                <button onClick={onEnterPlatform} className={`mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-sm font-medium ${dm ? 'bg-blue-600/15 text-blue-400 hover:bg-blue-600/25' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} transition-colors`}>
                  Try Live Demo <ChevronRight size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section id="ai-features" className={`${sectionBg()} py-20 border-b ${border}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-medium mb-4 border border-violet-500/20">
              <Brain size={13} /> AI-Powered
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">AI-Assisted Annotation</h2>
            <p className="text-lg opacity-70">Reduce manual effort by up to 80% with AI pre-labeling</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {aiFeatures.map((f) => (
              <div key={f.title} className={`${card} p-5`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${dm ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                  <f.icon size={18} />
                </div>
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className={`text-xs leading-relaxed ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success stories */}
      <section className={`${sectionBg(true)} py-20 border-b ${border}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Customer Success</h2>
            <p className="text-lg opacity-70">Trusted by leading AI and robotics companies</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {successStories.map((story) => (
              <div key={story.name} className={`${card} p-6`}>
                <div className={`flex items-center gap-3 mb-4`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${story.color} flex items-center justify-center text-white font-bold text-lg`}>
                    {story.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{story.name}</h3>
                    <p className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{story.industry}</p>
                  </div>
                </div>
                <p className={`text-sm leading-relaxed mb-4 ${dm ? 'text-slate-300' : 'text-slate-600'}`}>"{story.quote}"</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{story.author}</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${dm ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>{story.metric}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={`${sectionBg()} py-20 border-b ${border}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Pricing & Plans</h2>
            <p className="text-lg opacity-70">Choose the plan that scales with your annotation needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricing.map((p) => (
              <div key={p.name} className={`${card} p-6 ${p.highlight ? 'ring-2 ring-blue-500 relative' : ''}`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">Most Popular</div>
                )}
                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                <p className={`text-xs mb-4 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{p.desc}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{p.price}</span>
                  <span className={`text-sm ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{p.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className={dm ? 'text-slate-300' : 'text-slate-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => onAuth('register')} className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${p.highlight ? 'bg-blue-600 text-white hover:bg-blue-700' : (dm ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200')}`}>{p.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Docs */}
      <section id="docs" className={`${sectionBg(true)} py-20 border-b ${border}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Documentation & Resources</h2>
            <p className="text-lg opacity-70">Everything you need to get started and scale</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: BookOpen, title: 'User Guides', desc: 'Step-by-step tutorials for every feature' },
              { icon: Code, title: 'API Documentation', desc: 'REST API reference with code examples' },
              { icon: Target, title: 'Annotation Standards', desc: 'Best practices for labeling consistency' },
              { icon: Layers, title: 'Taxonomy Guidelines', desc: 'How to structure class hierarchies' },
              { icon: Shield, title: 'QA Guidelines', desc: 'Quality assurance workflows and checks' },
            ].map((d) => (
              <a key={d.title} href="#" className={`${card} p-5 group`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${dm ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  <d.icon size={18} />
                </div>
                <h3 className="font-semibold text-sm mb-1">{d.title}</h3>
                <p className={`text-xs leading-relaxed mb-2 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{d.desc}</p>
                <span className={`text-xs flex items-center gap-0.5 ${dm ? 'text-blue-400' : 'text-blue-600'}`}>Read more <ArrowUpRight size={12} /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`${sectionBg()} py-20`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your annotation pipeline?</h2>
          <p className="text-lg opacity-70 mb-8">Start with a free trial. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => onAuth('register')} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/20">Get Started Free <ArrowRight size={18} /></button>
            <button onClick={onEnterPlatform} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium ${dm ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>Live Demo</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${sectionBg(true)} border-t ${border} py-12`}>
        <div className={`max-w-7xl mx-auto px-4`}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center"><span className="text-white font-bold text-xs">GV</span></div>
                <span className="font-bold text-base">GV.AI</span>
              </div>
              <p className={`text-sm opacity-70 mb-4 max-w-xs`}>The enterprise annotation platform for 2D, 3D, video, and multi-camera data with AI-assisted labeling and built-in QA.</p>
            </div>
            {[
              { title: 'Platform', links: ['Services', 'Examples', 'Pricing', 'API Docs'] },
              { title: 'Company', links: ['About', 'Careers', 'Blog', 'Contact'] },
              { title: 'Resources', links: ['User Guides', 'Annotation Standards', 'QA Guidelines', 'Support'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-sm mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}><a href="#" className={`text-xs opacity-70 hover:opacity-100 hover:text-blue-500 transition-colors`}>{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className={`mt-8 pt-8 border-t ${border} flex items-center justify-between`}>
            <p className="text-xs opacity-50">© 2026 GV.AI. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-xs opacity-50 hover:opacity-100">Privacy</a>
              <a href="#" className="text-xs opacity-50 hover:opacity-100">Terms</a>
              <a href="#" className="text-xs opacity-50 hover:opacity-100">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
