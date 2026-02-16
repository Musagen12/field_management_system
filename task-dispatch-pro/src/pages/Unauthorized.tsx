import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '@/lib/auth';

const Unauthorized = () => {
  const navigate = useNavigate();
  const user = authStorage.getUser();

  const goToDashboard = () => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else if (user?.role === 'worker') {
      navigate('/worker');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-destructive rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-destructive-foreground" />
          </div>
          <CardTitle className="text-2xl text-destructive">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your current role ({user?.role || 'unknown'}) doesn't have access to this resource.
          </p>
          <Button onClick={goToDashboard} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;