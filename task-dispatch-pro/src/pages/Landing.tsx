import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  ClipboardList, 
  Users, 
  AlertTriangle, 
  Camera,
  MapPin,
  FileText,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';
import { PublicComplaintForm } from '@/components/PublicComplaintForm';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: ClipboardList,
      title: "Task Management",
      description: "Create, assign, and track field service tasks with real-time status updates and progress monitoring."
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Separate admin and worker dashboards with appropriate permissions and functionality for each role."
    },
    {
      icon: Camera,
      title: "Photo Documentation",
      description: "Workers can upload completion photos to verify task completion and maintain quality records."
    },
    {
      icon: AlertTriangle,
      title: "Complaint Management",
      description: "Submit and track complaints with file attachments and location data for swift resolution."
    },
    {
      icon: MapPin,
      title: "Location Tracking",
      description: "GPS-enabled complaint submission and task location management for accurate field service."
    },
    {
      icon: FileText,
      title: "Audit Logs",
      description: "Comprehensive audit trail of all system activities for compliance and accountability."
    }
  ];

  const benefits = [
    "Streamlined task assignment and tracking",
    "Improved communication between admin and workers", 
    "Real-time status updates and notifications",
    "Mobile-optimized for field workers",
    "Comprehensive reporting and analytics",
    "Secure JWT-based authentication"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">Field Service Tracker</h1>
          </div>
          <Button onClick={() => navigate('/login')}>
            Sign In
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-muted via-background to-muted py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  Professional Field Service Management
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  Streamline Your Field Operations
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Manage tasks, track progress, and handle complaints with our comprehensive field service tracking platform designed for modern teams.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8"
                  onClick={() => navigate('/login')}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-lg px-8"
                >
                  Learn More
                </Button>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-muted-foreground">
                  Trusted by <span className="font-semibold text-foreground">500+</span> field service teams
                </p>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Field service professional using tablet"
                className="rounded-2xl shadow-2xl w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">24 Tasks Completed</p>
                    <p className="text-sm text-muted-foreground">Today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Powerful Features for Field Teams</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage field operations efficiently and keep your team productive.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold">
                  Why Choose Field Service Tracker?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Built specifically for field service teams who need reliable, efficient task and complaint management.
                </p>
              </div>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-success-foreground" />
                    </div>
                    <p className="text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-card p-6 rounded-xl border shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">98%</div>
                  <p className="text-muted-foreground">Task Completion Rate</p>
                </div>
                <div className="bg-card p-6 rounded-xl border shadow-sm">
                  <div className="text-3xl font-bold text-success mb-2">2.5x</div>
                  <p className="text-muted-foreground">Faster Resolution</p>
                </div>
              </div>
              <div className="space-y-6 pt-8">
                <div className="bg-card p-6 rounded-xl border shadow-sm">
                  <div className="text-3xl font-bold text-warning mb-2">500+</div>
                  <p className="text-muted-foreground">Active Teams</p>
                </div>
                <div className="bg-card p-6 rounded-xl border shadow-sm">
                  <div className="text-3xl font-bold text-info mb-2">24/7</div>
                  <p className="text-muted-foreground">Support Available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Complaints Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold">Submit a Service Complaint</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experienced an issue with our field service? Let us know and we'll investigate promptly.
            </p>
          </div>
          <PublicComplaintForm />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground">
              Ready to Transform Your Field Operations?
            </h2>
            <p className="text-xl text-primary-foreground/90">
              Join hundreds of teams already using Field Service Tracker to streamline their operations.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8"
              onClick={() => navigate('/login')}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Field Service Tracker</span>
            </div>
            <p className="text-muted-foreground text-center md:text-right">
              © 2024 Field Service Tracker. Built for modern field teams.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;