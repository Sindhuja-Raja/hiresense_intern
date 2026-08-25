import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Linkedin, 
  Globe, 
  GraduationCap,
  Briefcase,
  Plus,
  X,
  Save,
  Loader2,
  CheckCircle,
  Upload,
  Award,
  Sparkles,
  Languages,
  ExternalLink
} from 'lucide-react';
import { profileApi, Profile, ResumeParseSuggestions } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Default skill suggestions for autocomplete
const DEFAULT_SKILLS = [
  // Frontend
  'React', 'Angular', 'Vue.js', 'Next.js', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'SASS', 'Redux', 'Material UI',
  // Backend
  'Node.js', 'Express.js', 'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'C#', '.NET', 'PHP', 'Laravel', 'Ruby', 'Ruby on Rails', 'Go', 'Rust',
  // Database
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'SQLite', 'Oracle', 'DynamoDB',
  // DevOps & Cloud
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Terraform', 'Linux',
  // Mobile
  'React Native', 'Flutter', 'iOS', 'Swift', 'Android', 'Kotlin',
  // Other
  'Git', 'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum', 'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch'
];

const ApplicantProfile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [parsedSuggestions, setParsedSuggestions] = useState<ResumeParseSuggestions | null>(null);
  const [autoFillOnParse, setAutoFillOnParse] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    location: '',
    bio: '',
    resumeUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    experience: '',
    education: '',
    certifications: '',  // comma-separated string for easy editing
    languages: '',
    summary: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await profileApi.getProfile();
      const userData = response.data?.user;
      if (userData) {
        setProfile(userData);
        setFormData({
          fullName: userData.fullName || '',
          phone: userData.phone || '',
          location: userData.location || '',
          bio: userData.bio || '',
          resumeUrl: userData.resumeUrl || '',
          linkedinUrl: userData.linkedinUrl || '',
          portfolioUrl: userData.portfolioUrl || '',
          experience: userData.experience || '',
          education: userData.education || '',
          certifications: (userData.certifications || []).join(', '),
          languages: (userData.languages || []).join(', '),
          summary: userData.summary || '',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Convert comma-separated strings back to arrays before saving
      const payload = {
        ...formData,
        certifications: formData.certifications
          ? formData.certifications.split(',').map((c) => c.trim()).filter(Boolean)
          : [],
        languages: formData.languages
          ? formData.languages.split(',').map((l) => l.trim()).filter(Boolean)
          : [],
      };
      const response = await profileApi.updateProfile(payload);
      const updatedUser = response.data?.user;
      if (updatedUser) {
        setProfile(updatedUser);
        if (updatedUser.fullName !== user?.fullName) {
          updateUser({ fullName: updatedUser.fullName });
        }
      }
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleParseResume = async () => {
    if (!resumeFile) {
      toast({
        title: 'Select a file',
        description: 'Please select a PDF or DOCX resume first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsParsingResume(true);
      const response = await profileApi.parseAndSaveResume(resumeFile, autoFillOnParse);
      const suggestions = response.data?.suggestions;
      const uploadedResumeUrl = response.data?.resumeUrl;
      const updatedUser = response.data?.user;
      if (!suggestions) {
        throw new Error('No suggestions returned');
      }

      setParsedSuggestions(suggestions);
      if (updatedUser) {
        setProfile(updatedUser);
      }
      setFormData((prev) => ({
        ...prev,
        fullName: updatedUser?.fullName || prev.fullName,
        phone: updatedUser?.phone || suggestions.phone || prev.phone,
        location: updatedUser?.location || suggestions.location || prev.location,
        bio: updatedUser?.bio || suggestions.summary || prev.bio,
        resumeUrl: updatedUser?.resumeUrl || uploadedResumeUrl || prev.resumeUrl,
        linkedinUrl: updatedUser?.linkedinUrl || prev.linkedinUrl,
        portfolioUrl: updatedUser?.portfolioUrl || prev.portfolioUrl,
        experience: updatedUser?.experience || suggestions.experience || prev.experience,
        education: updatedUser?.education || suggestions.education || prev.education,
        certifications: (updatedUser?.certifications || suggestions.certifications || []).join(', ') || prev.certifications,
        languages: (updatedUser?.languages || suggestions.languages || []).join(', ') || prev.languages,
        summary: updatedUser?.summary || suggestions.summary || prev.summary,
      }));
      toast({
        title: 'Resume parsed and saved',
        description: autoFillOnParse
          ? 'Resume and parsed profile fields were saved to your account.'
          : 'Resume was saved and suggestions are ready for manual apply.',
      });
    } catch (error: any) {
      toast({
        title: 'Parse failed',
        description: error.message || 'Unable to parse resume file',
        variant: 'destructive',
      });
    } finally {
      setIsParsingResume(false);
    }
  };

  const applyParsedSuggestions = () => {
    if (!parsedSuggestions) return;

    const existingSkills = new Set((profile?.skills || []).map((s) => s.toLowerCase()));
    const mergedSkills = [...(profile?.skills || [])];
    parsedSuggestions.skills.forEach((skill) => {
      if (!existingSkills.has(skill.toLowerCase())) {
        mergedSkills.push(skill);
        existingSkills.add(skill.toLowerCase());
      }
    });
    setProfile((prev) => prev ? { ...prev, skills: mergedSkills } : prev);
    setFormData((prev) => ({
      ...prev,
      experience: parsedSuggestions.experience || prev.experience,
      education: parsedSuggestions.education || prev.education,
      certifications: parsedSuggestions.certifications?.join(', ') || prev.certifications,
      languages: parsedSuggestions.languages?.join(', ') || prev.languages,
      summary: parsedSuggestions.summary || prev.summary,
      phone: parsedSuggestions.phone || prev.phone,
      location: parsedSuggestions.location || prev.location,
    }));
    toast({ title: 'Suggestions applied', description: 'Review the updated fields and click Save Profile.' });
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    
    setAddingSkill(true);
    try {
      const response = await profileApi.addSkill(newSkill.trim());
      if (response.data?.user?.skills) {
        setProfile(prev => prev ? { ...prev, skills: response.data!.user.skills } : null);
      }
      setNewSkill('');
      toast({
        title: 'Skill Added',
        description: `"${newSkill.trim()}" has been added to your skills`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add skill',
        variant: 'destructive',
      });
    } finally {
      setAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (skill: string) => {
    try {
      const response = await profileApi.removeSkill(skill);
      if (response.data?.user?.skills) {
        setProfile(prev => prev ? { ...prev, skills: response.data!.user.skills } : null);
      }
      toast({
        title: 'Skill Removed',
        description: `"${skill}" has been removed from your skills`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove skill',
        variant: 'destructive',
      });
    }
  };

  // Handle skill input change with autocomplete
  const handleSkillInputChange = (value: string) => {
    setNewSkill(value);
    
    if (value.trim().length > 0) {
      const existingSkills = profile?.skills || [];
      const suggestions = DEFAULT_SKILLS.filter(
        skill => 
          skill.toLowerCase().includes(value.toLowerCase()) &&
          !existingSkills.some(s => s.toLowerCase() === skill.toLowerCase())
      ).slice(0, 8);
      setFilteredSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  };

  const selectSuggestion = (skill: string) => {
    setNewSkill(skill);
    setShowSuggestions(false);
    setFilteredSuggestions([]);
  };

  const calculateProfileCompletion = (): number => {
    if (!profile) return 0;

    let completed = 0;
    const total = 10;

    if (profile.fullName) completed++;
    if (profile.phone) completed++;
    if (profile.location) completed++;
    if (profile.bio || (profile as any).summary) completed++;
    if (profile.skills && profile.skills.length > 0) completed++;
    if (profile.resumeUrl) completed++;
    if (profile.experience) completed++;
    if (profile.education) completed++;
    if ((profile as any).certifications?.length > 0) completed++;
    if (profile.linkedinUrl) completed++;

    return Math.round((completed / total) * 100);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your profile information and skills</p>
      </div>

      {/* Profile Completion Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Profile Strength</h3>
              <p className="text-sm text-muted-foreground">
                Complete your profile to increase visibility to recruiters
              </p>
              {/* Progress bar */}
              <div className="mt-2 w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${calculateProfileCompletion()}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">
                {calculateProfileCompletion()}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Your personal details visible to recruiters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-muted pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 000-0000"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="New York, NY"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio / About Me</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell recruiters about yourself, your passion, and what you're looking for..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resume & Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resume & Links
              </CardTitle>
              <CardDescription>Add your resume and professional profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resumeUrl">Resume URL</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="resumeUrl"
                      name="resumeUrl"
                      value={formData.resumeUrl}
                      onChange={handleInputChange}
                      placeholder="https://drive.google.com/yourresume.pdf"
                      className="pl-10"
                    />
                  </div>
                  {formData.resumeUrl && (
                    <Button type="button" variant="outline" asChild>
                      <a 
                        href={formData.resumeUrl.startsWith('/') ? `http://localhost:5001${formData.resumeUrl}` : formData.resumeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </a>
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload your resume to Google Drive, Dropbox, or any file hosting service and paste the link here
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resumeFile">Upload Resume for Auto-Parse (PDF/DOCX)</Label>
                <Input
                  id="resumeFile"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleParseResume}
                    disabled={!resumeFile || isParsingResume}
                  >
                    {isParsingResume ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Parsing Resume...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Parse Resume
                      </>
                    )}
                  </Button>
                  {parsedSuggestions && (
                    <Button type="button" onClick={applyParsedSuggestions}>
                      Apply Suggestions
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoFillOnParse"
                    checked={autoFillOnParse}
                    onCheckedChange={(checked) => setAutoFillOnParse(checked === true)}
                  />
                  <Label htmlFor="autoFillOnParse" className="text-sm font-normal cursor-pointer">
                    Auto-save parsed skills, education, and experience
                  </Label>
                </div>
                {parsedSuggestions && (
                  <div className="rounded-md border p-3 bg-muted/30 text-xs space-y-1">
                    <p className="font-medium flex items-center gap-1">
                      {parsedSuggestions.parsedViaAI ? (
                        <><Sparkles className="w-3 h-3 text-primary" /> AI-parsed from resume:</>
                      ) : (
                        'Detected from resume (regex):'
                      )}
                    </p>
                    <p><span className="text-muted-foreground">Skills:</span> {parsedSuggestions.skills.length > 0 ? parsedSuggestions.skills.join(', ') : 'None detected'}</p>
                    <p><span className="text-muted-foreground">Experience:</span> {parsedSuggestions.experience || 'Not detected'}</p>
                    <p><span className="text-muted-foreground">Education:</span> {parsedSuggestions.education || 'Not detected'}</p>
                    {parsedSuggestions.certifications?.length > 0 && (
                      <p><span className="text-muted-foreground">Certifications:</span> {parsedSuggestions.certifications.join(', ')}</p>
                    )}
                    {parsedSuggestions.languages?.length > 0 && (
                      <p><span className="text-muted-foreground">Languages:</span> {parsedSuggestions.languages.join(', ')}</p>
                    )}
                    {parsedSuggestions.location && (
                      <p><span className="text-muted-foreground">Location:</span> {parsedSuggestions.location}</p>
                    )}
                    {parsedSuggestions.phone && (
                      <p><span className="text-muted-foreground">Phone:</span> {parsedSuggestions.phone}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolioUrl">Portfolio / Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="portfolioUrl"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleInputChange}
                    placeholder="https://yourportfolio.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience & Education */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Experience & Education
              </CardTitle>
              <CardDescription>Describe your professional background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Work Experience</Label>
                <Textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="Example:
• Software Engineer at TechCorp (2022-Present)
  - Developed React applications with TypeScript
  - Led team of 3 developers on key projects

• Junior Developer at StartupXYZ (2020-2022)
  - Built REST APIs with Node.js"
                  rows={6}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.experience.length}/2000 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Textarea
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  placeholder="Example:
• B.S. Computer Science, University of XYZ (2020)
• Full Stack Bootcamp Graduate (2019)"
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.education.length}/2000 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications" className="flex items-center gap-1">
                  <Award className="w-4 h-4" /> Certifications
                </Label>
                <Input
                  id="certifications"
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleInputChange}
                  placeholder="e.g. AWS Solutions Architect, PMP, Scrum Master (comma-separated)"
                />
                <p className="text-xs text-muted-foreground">Separate multiple certifications with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="languages" className="flex items-center gap-1">
                  <Languages className="w-4 h-4" /> Languages
                </Label>
                <Input
                  id="languages"
                  name="languages"
                  value={formData.languages}
                  onChange={handleInputChange}
                  placeholder="e.g. English, Hindi, Tamil (comma-separated)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  placeholder="A brief professional summary (auto-filled from resume AI parse)"
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSaveProfile} 
            disabled={saving}
            className="w-full md:w-auto"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </div>

        {/* Skills Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Skills
              </CardTitle>
              <CardDescription>Add skills to showcase your expertise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Skill Input with Autocomplete */}
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => handleSkillInputChange(e.target.value)}
                    placeholder="Type to search skills..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                      if (e.key === 'Escape') {
                        setShowSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      if (newSkill.trim().length > 0 && filteredSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding to allow click on suggestion
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                  />
                  <Button 
                    onClick={handleAddSkill} 
                    disabled={addingSkill || !newSkill.trim()}
                    size="icon"
                  >
                    {addingSkill ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((skill, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                        onClick={() => selectSuggestion(skill)}
                      >
                        <Plus className="h-3 w-3 text-muted-foreground" />
                        <span>{skill}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Add Popular Skills */}
              {profile?.skills && profile.skills.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Popular skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {['React', 'Node.js', 'Python', 'Java', 'TypeScript', 'AWS'].map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                        onClick={() => {
                          setNewSkill(skill);
                          handleAddSkill();
                        }}
                      >
                        + {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Skills List */}
              <div className="flex flex-wrap gap-2">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center w-full py-4">
                    No skills added yet. Add your first skill above!
                  </p>
                )}
              </div>

              {profile?.skills && profile.skills.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {profile.skills.length} skill{profile.skills.length !== 1 ? 's' : ''} added
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Profile Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Add a professional bio to stand out</p>
              <p>• Include relevant skills for your field</p>
              <p>• Keep your resume link up to date</p>
              <p>• Add your LinkedIn for credibility</p>
              <p>• Describe your experience in detail</p>
            </CardContent>
          </Card>

          {/* Preview Card */}
          {profile && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardHeader>
                <CardTitle className="text-sm">Recruiter Preview</CardTitle>
                <CardDescription className="text-xs">How recruiters see your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{formData.fullName || 'Your Name'}</p>
                    <p className="text-xs text-muted-foreground">{formData.location || 'Location'}</p>
                  </div>
                </div>
                {formData.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{formData.bio}</p>
                )}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.slice(0, 4).map((skill, i) => (
                      <Badge key={i} variant="outline" className="text-xs py-0">
                        {skill}
                      </Badge>
                    ))}
                    {profile.skills.length > 4 && (
                      <Badge variant="outline" className="text-xs py-0">
                        +{profile.skills.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantProfile;
