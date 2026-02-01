import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <span className="text-white font-bold text-3xl">V</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
              Welcome to Vikki Legal CRM
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive case management for personal injury law firms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-blue-600">Streamlined</CardTitle>
                <CardDescription>Case Management</CardDescription>
              </CardHeader>
              <CardContent>
                Efficiently manage cases from intake to settlement with our comprehensive workflow tools.
              </CardContent>
            </Card>
            
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-blue-600">Integrated</CardTitle>
                <CardDescription>Provider Network</CardDescription>
              </CardHeader>
              <CardContent>
                Access and manage your entire medical provider network in one centralized location.
              </CardContent>
            </Card>
            
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-blue-600">Powerful</CardTitle>
                <CardDescription>Analytics</CardDescription>
              </CardHeader>
              <CardContent>
                Gain valuable insights with real-time data visualization and comprehensive reporting.
              </CardContent>
            </Card>
          </div>

          <Link to="/home">
            <Button size="lg" className="group mt-8">
              Enter Dashboard
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
      
      <footer className="w-full py-6 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Vikki Legal CRM. All rights reserved.</p>
      </footer>
    </div>
  );
}
