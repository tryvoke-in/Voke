const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add MapPin to lucide-react import
content = content.replace(
  /Trash2, Edit, MessageSquare, Flag, Ban, Code2, Mail/,
  'Trash2, Edit, MessageSquare, Flag, Ban, Code2, Mail, MapPin'
);

// 2. Add navigation item
const navItem = `{ id: "locations", label: "Job Locations", icon: MapPin },`;
content = content.replace(
  /{ id: "settings", label: "System Settings", icon: Settings },/,
  `${navItem}\n            { id: "settings", label: "System Settings", icon: Settings },`
);

// 3. Add states
const statesBlock = `  const [locations, setLocations] = useState<any[]>([]);
  const [newLocationName, setNewLocationName] = useState("");
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
`;
content = content.replace(
  /const \[isLoadingUsers, setIsLoadingUsers\] = useState\(false\);/,
  `const [isLoadingUsers, setIsLoadingUsers] = useState(false);\n${statesBlock}`
);

// 4. Add fetchLocations function and useEffect call
const fetchFn = `
  const fetchLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const { data, error } = await supabase
        .from('monitored_locations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error("Failed to fetch locations");
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return;
    try {
      const { error } = await supabase
        .from('monitored_locations')
        .insert([{ location_name: newLocationName.trim() }]);
      if (error) throw error;
      toast.success("Location added");
      setNewLocationName("");
      fetchLocations();
    } catch (err: any) {
      toast.error("Failed to add location: " + err.message);
    }
  };

  const handleToggleLocation = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('monitored_locations')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success("Location status updated");
      fetchLocations();
    } catch (err: any) {
      toast.error("Failed to update location");
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('monitored_locations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("Location deleted");
      fetchLocations();
    } catch (err: any) {
      toast.error("Failed to delete location");
    }
  };
`;
content = content.replace(
  /const fetchUsers = async \(\) => {/,
  `${fetchFn}\n  const fetchUsers = async () => {`
);

content = content.replace(
  /fetchAnalytics\(\);/,
  `fetchAnalytics();\n    fetchLocations();`
);

// 5. Add Locations Tab Content before </AnimatePresence>
const locationsTab = `
            {activeTab === "locations" && (
              <motion.div
                key="locations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-violet-400" />
                      Manage Monitored Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4">
                      <Input 
                        placeholder="E.g., Pune, Mumbai, London" 
                        value={newLocationName}
                        onChange={(e) => setNewLocationName(e.target.value)}
                        className="bg-black/50 border-white/10 text-white flex-1"
                      />
                      <Button onClick={handleAddLocation} className="bg-violet-600 hover:bg-violet-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Add Location
                      </Button>
                    </div>

                    <div className="rounded-xl border border-white/10 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-white/5">
                          <TableRow className="border-white/10">
                            <TableHead className="text-gray-400">Location Name</TableHead>
                            <TableHead className="text-gray-400">Status</TableHead>
                            <TableHead className="text-gray-400">Added On</TableHead>
                            <TableHead className="text-right text-gray-400">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingLocations ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-gray-500">Loading locations...</TableCell>
                            </TableRow>
                          ) : locations.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-gray-500">No locations tracked yet.</TableCell>
                            </TableRow>
                          ) : (
                            locations.map(loc => (
                              <TableRow key={loc.id} className="border-white/10 hover:bg-white/5">
                                <TableCell className="font-medium text-gray-200">{loc.location_name}</TableCell>
                                <TableCell>
                                  <Switch 
                                    checked={loc.is_active}
                                    onCheckedChange={() => handleToggleLocation(loc.id, loc.is_active)}
                                    className="data-[state=checked]:bg-emerald-500"
                                  />
                                </TableCell>
                                <TableCell className="text-gray-400">{formatDate(loc.created_at)}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteLocation(loc.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
`;

content = content.replace(
  /          <\/AnimatePresence>/,
  `${locationsTab}\n          </AnimatePresence>`
);

fs.writeFileSync(filePath, content);
console.log('Successfully patched AdminDashboard.tsx');
