import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { aiApi, jobsApi, Job, Profile } from '@/lib/api';
import { Search, MapPin, Briefcase, User, Sparkles, Loader2, BookOpen, ChevronDown, AlertCircle, Key } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect } from 'react';

const CandidateDiscovery = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [parsedCriteria, setParsedCriteria] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('any');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await jobsApi.getAll();
        setJobs(response.data?.jobs || []);
      } catch (error) {
        console.error("Failed to fetch jobs", error);
      }
    };
    fetchJobs();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (selectedJobId === 'any') {
      toast({
        title: 'Select a Job',
        description: 'Please select a target job for this search.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      const response = await aiApi.searchCandidates(query);
      setCandidates(response.data?.candidates || []);
      setParsedCriteria(response.data?.criteria);
      setHasSearched(true);
    } catch (error: any) {
      // Extract message from API error response body
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Could not perform AI search. Please try again.';
      setSearchError(message);
      toast({
        title: 'AI Search Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          Candidate Discovery
        </h1>
        <p className="text-muted-foreground">
          Use natural language to instantly query your entire candidate database.
        </p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden shadow-md">
        <CardContent className="p-6">
          <div className="mb-4">
            <label className="text-sm font-medium mb-1.5 block">Target Job</label>
            <Select value={selectedJobId} onValueChange={(val) => {
              setSelectedJobId(val);
              if (val !== 'any' && !query) {
                const job = jobs.find(j => j._id === val);
                if (job) {
                  setQuery(`Find me a ${job.title} in ${job.location} with ${job.experienceMin || 0}+ years experience matching skills: ${job.skillsRequired?.slice(0,3).join(', ')}`);
                }
              }
            }}>
              <SelectTrigger className="w-full md:w-[350px]">
                <SelectValue placeholder="Select a job to source candidates for" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">-- Select a Job --</SelectItem>
                {jobs.map(job => (
                  <SelectItem key={job._id} value={job._id}>{job.title} ({job.location})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., 'Find me a senior React developer in NY with 5+ years experience'"
                className="pl-10 h-14 text-lg bg-background/80 backdrop-blur-sm border-primary/20 shadow-inner rounded-xl focus-visible:ring-primary/50"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 rounded-xl" disabled={isSearching || !query.trim() || selectedJobId === 'any'}>
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
              AI Search
            </Button>
          </form>

          {parsedCriteria && (
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground bg-background/50 p-3 rounded-lg border border-primary/10">
              <span className="font-medium text-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" /> AI Extracted Filters:
              </span>
              {parsedCriteria.skills?.length > 0 && (
                <Badge variant="secondary" className="bg-primary/10 hover:bg-primary/20">
                  Skills: {parsedCriteria.skills.join(', ')}
                </Badge>
              )}
              {parsedCriteria.location && (
                <Badge variant="secondary" className="bg-primary/10 hover:bg-primary/20">
                  Location: {parsedCriteria.location}
                </Badge>
              )}
              {parsedCriteria.minYearsExperience !== undefined && (
                <Badge variant="secondary" className="bg-primary/10 hover:bg-primary/20">
                  Min Exp: {parsedCriteria.minYearsExperience}+ years
                </Badge>
              )}
              {parsedCriteria.education && (
                <Badge variant="secondary" className="bg-primary/10 hover:bg-primary/20">
                  Education: {parsedCriteria.education}
                </Badge>
              )}
              {Object.keys(parsedCriteria).length === 0 && (
                <span className="italic">No specific hard filters extracted. Searching all applicants.</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Banner */}
      {searchError && (
        <div className="flex items-start gap-3 p-4 rounded-xl border-2 border-destructive/30 bg-destructive/5 text-destructive">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">AI Search Unavailable</p>
            <p className="text-sm mt-1 text-destructive/80">{searchError}</p>
            {searchError.includes('API key') || searchError.includes('GROQ') ? (
              <p className="text-xs mt-2 flex items-center gap-1 font-medium text-destructive/70">
                <Key className="w-3 h-3" />
                Add <code className="font-mono bg-destructive/10 px-1 rounded">GROQ_API_KEY=your_key</code> to <code className="font-mono bg-destructive/10 px-1 rounded">backend/.env</code> and restart the server.
                Get a free key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline">console.groq.com</a>
              </p>
            ) : null}
          </div>
        </div>
      )}

      {hasSearched && !isSearching && !searchError && candidates.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-xl font-medium text-foreground mb-2">No Candidates Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We couldn't find any candidates matching your exact criteria in the database. 
              Try broadening your search terms or lowering the experience requirements.
            </p>
          </CardContent>
        </Card>
      )}

      {candidates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              Found {candidates.length} Match{candidates.length === 1 ? '' : 'es'}
            </h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {candidates.map((candidate) => {
              // Profile uses _id (MongoDB), not id — using id produces undefined keys
              // and breaks the View Profile link (/recruiter/applicants/undefined)
              const candidateId = (candidate as any)._id || candidate.id || candidate.email;
              return (
              <Card key={candidateId} className="hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <span className="font-bold text-primary text-lg">
                        {getInitials(candidate.fullName)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                        {candidate.fullName}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">{candidate.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 mb-4">
                    {candidate.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2 text-primary/70" />
                        <span className="truncate">{candidate.location}</span>
                      </div>
                    )}
                    {candidate.experience && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Briefcase className="w-4 h-4 mr-2 text-primary/70" />
                        <span className="truncate">{candidate.experience}</span>
                      </div>
                    )}
                    {candidate.education && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <BookOpen className="w-4 h-4 mr-2 text-primary/70" />
                        <span className="truncate">{candidate.education}</span>
                      </div>
                    )}
                    
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="pt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.skills.slice(0, 4).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills.length > 4 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              +{candidate.skills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto space-y-2">
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                      <Link to={`/recruiter/applicants/${candidateId}`}>
                        View Full Profile
                      </Link>
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={() => {
                      toast({ title: "Invitation Sent", description: `Invited ${candidate.fullName} to apply for the selected job.` });
                    }}>
                      <Briefcase className="w-4 h-4 mr-2" /> Invite to Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDiscovery;
