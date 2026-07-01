
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const Companies = () => {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .order('name');

            if (error) throw error;
            setCompanies(data || []);
        } catch (error) {
            console.error("Error fetching companies:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-24">
                <div className="max-w-2xl mx-auto text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
                        Company Questions
                    </h1>
                    <p className="text-muted-foreground text-lg mb-8">
                        Practice most frequent interview questions from top tech companies.
                    </p>

                    <div className="relative max-w-md mx-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search companies (e.g. Google, Amazon)..."
                            className="pl-10 h-12 text-lg rounded-full shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredCompanies.map((company, index) => (
                            <motion.div
                                key={company.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card
                                    className="hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur-sm"
                                    onClick={() => navigate(`/companies/${company.slug}`)}
                                >
                                    <CardContent className="p-6 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-sm mb-4 border border-gray-100 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={`https://www.google.com/s2/favicons?domain=${company.name.toLowerCase().replace(/\s/g, '')}.com&sz=128`}
                                                crossOrigin="anonymous"
                                                onError={(e) => {
                                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=random&color=fff&size=64`;
                                                }}
                                                alt={`${company.name} logo`}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                                            {company.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            View Questions <ChevronRight className="w-3 h-3" />
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {!loading && filteredCompanies.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No companies found matching "{searchTerm}"
                    </div>
                )}
            </main>
        </div>
    );
};

export default Companies;
