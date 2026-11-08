const videoFields = [
  { key: 'SETTING', label: 'SETTING' },
  { key: 'LIGHTING', label: 'LIGHTING' },
  { key: 'SCENE_VIDEO', label: 'SCENE VIDEO' },
  { key: 'MAIN_OBJECT', label: 'MAIN OBJECT' },
  { key: 'ACTION_0_1S', label: 'ACTION 0-1S' },
  { key: 'ACTION_1_3S', label: 'ACTION 1-3S' },
  { key: 'ACTION_3_7S', label: 'ACTION 3-7S' },
  { key: 'ACTION_7_10S', label: 'ACTION 7-10s' },
  { key: 'MOOD', label: 'MOOD' },
];

const dataTopicMap = {
  1: 'Walking in a Bamboo Forest',
  2: 'Cherry Blossom Tree in Full Bloom',
  3: 'Japanese Moss Garden at Dawn',
  4: 'Stone Steps to a Temple in Mist',
  5: 'Still Pond Under Cherry Blossoms',
  6: 'Cedar Forest Path After Rain',
  7: 'Red Maples Over a Quiet Stream',
  8: 'Zen Rock Garden',
  9: 'Cherry Blossom Petals on a River',
  10: 'Mountain Valley at Dawn',
};

const dataTopicReplacementMap = {
  1: {
    SETTING: ['a quiet bamboo forest', 'a tall cedar forest', 'a quiet temple forest'],
    LIGHTING: [
      'soft afternoon shade, dappled sunlight filtering through bamboo leaves',
      'soft light after rain, sun rays breaking through',
      'soft morning mist',
    ],
    SCENE_VIDEO: [
      'a slow forward walk down a shaded narrow earth path covered in fallen bamboo leaves between tall green bamboo stalks, with fallen bamboo leaves scattered on the path and soft green bamboo and mist in the distance',
    ],
    MAIN_OBJECT: ['tall green bamboo stalks', 'tall cedar trees', 'tall pine trees'],
    ACTION_0_1S: [
      'camera is already moving forward slowly down the path as soft light shifts through the leaves, the sound of bamboo creaking softly and leaves rustling, calm and quiet',
    ],
    ACTION_1_3S: [
      'a single leaf drifts down slowly across the path, the bamboo sways gently, the walk continues',
    ],
    ACTION_3_7S: [
      'camera moves forward slowly and smoothly, revealing the path curving gently ahead under the same tall green bamboo stalks in dappled sunlight, every detail staying the same, in tack-sharp focus',
    ],
    ACTION_7_10S: [
      'the camera settles into a calm wide view of the same path, leaves drifting slowly',
    ],
    MOOD: ['Calm, slow, peaceful', 'Calm, slow, quiet', 'Calm, slow, restful'],
  },
  2: {
    SETTING: ['a quiet Japanese garden', 'a quiet park', 'a calm temple garden'],
    LIGHTING: ['soft afternoon shade, dappled sunlight', 'soft morning light', 'golden hour shade'],
    SCENE_VIDEO: [
      'one big cherry blossom tree in full bloom, off-center, soft pink petals falling slowly in the breeze',
    ],
    MAIN_OBJECT: [
      'a cherry blossom tree in full bloom',
      'a pink cherry blossom tree',
      'a white blossom tree',
    ],
    ACTION_0_1S: [
      'camera starts already close on the blossom as petals fall slowly, the sound of a light breeze, calm and quiet',
    ],
    ACTION_1_3S: ['more petals drift down, a branch sways gently'],
    ACTION_3_7S: [
      'camera pulls back slowly and smoothly, revealing the full tree and the garden around it, every detail staying the same, in tack-sharp focus',
    ],
    ACTION_7_10S: [
      'the camera settles into a calm wide view of the same tree, petals falling slowly',
    ],
    MOOD: ['Calm, slow, peaceful', 'Calm, slow, quiet', 'Calm, slow, dreamy'],
  },
  3: {
    SETTING: ['a quiet Japanese moss garden', 'a shaded temple garden', 'a calm garden courtyard'],
    LIGHTING: ['soft dawn mist', 'soft morning light ', 'soft afternoon shade'],
    SCENE_VIDEO: [
      'a soft green moss carpet with a small stone lantern, mist drifting slowly through the garden',
    ],
    MAIN_OBJECT: [
      'soft green moss and a small stone lantern',
      'a moss-covered stone lantern',
      'a soft green moss garden',
    ],
    ACTION_0_1S: [
      'camera starts already low over the moss as mist drifts slowly, near-silence, calm and quiet',
    ],
    ACTION_1_3S: ['mist moves gently, a distant bird sings once'],
    ACTION_3_7S: [
      'camera pulls back slowly and smoothly, revealing the moss garden and the trees around it, every detail staying the same, in tack-sharp focus',
    ],
    ACTION_7_10S: [
      'the camera settles into a calm wide view of the same moss garden, mist drifting slowly',
    ],
    MOOD: ['Calm, slow, peaceful', 'Calm, slow, quiet', 'Calm, slow, meditative'],
  },
  4: {
    SETTING: ['a misty cedar forest', 'a quiet mountain forest', 'a shaded temple forest'],
    LIGHTING: ['soft morning mist', 'soft dawn mist', 'soft afternoon shade'],
    SCENE_VIDEO: [
      'moss-covered stone steps leading up through tall cedar trees in mist, a glimpse of a wooden temple roof above',
    ],
    MAIN_OBJECT: [
      'moss-covered stone steps',
      'mossy stone steps and tall cedar trees',
      'stone steps to a wooden temple',
    ],
    ACTION_0_1S: [
      'camera is already moving forward slowly up the steps as mist drifts, the sound of soft wind, calm and quiet',
    ],
    ACTION_1_3S: ['mist moves gently, a leaf drifts down onto a step'],
    ACTION_3_7S: [
      'camera moves forward slowly and smoothly, revealing the steps curving up ahead under the same tall cedars, every detail staying the same, in tack-sharp focus',
    ],
    ACTION_7_10S: [
      'the camera settles into a calm wide view of the same steps, mist drifting slowly',
    ],
    MOOD: ['Calm, slow, peaceful', 'Calm, slow, quiet', 'Calm, slow, sacred'],
  },
  5: {
    SETTING: ['a quiet Japanese garden ', 'a shaded temple garden', 'a quiet park pond'],
    LIGHTING: [
      'soft afternoon shade, dappled sunlight',
      'soft golden afternoon shade',
      'soft morning mist',
    ],
    SCENE_VIDEO: [
      'a still clear koi pond under a cherry blossom tree in full bloom, with orange and white koi, pink cherry blossom petals floating on the water, and mossy stones and a small stone lantern',
    ],
    MAIN_OBJECT: ['a cherry blossom tree in full bloom', 'a red maple tree', 'a green willow tree'],
    ACTION_0_1S: [
      'camera starts already close on the water as a pink cherry blossom petal lands softly, a ripple spreading, orange and white koi gliding slowly just below the surface, the water sound clear, calm and quiet',
    ],
    ACTION_1_3S: ['a second petal lands, the koi turns slowly and glides on, ripples fading'],
    ACTION_3_7S: [
      'camera pulls back slowly and smoothly, revealing the full pond and the off-center cherry blossom tree in dappled sunlight, every detail staying the same, in tack-sharp focus',
    ],
    ACTION_7_10S: [
      'the camera settles into a calm wide view of the same pond, petals drifting slowly, the koi settling',
    ],
    MOOD: ['Calm, slow, peaceful', 'Calm, slow, quiet', 'Calm, slow, restful'],
  },
  6: {
    SETTING: ['a tall cedar forest', 'a quiet bamboo forest', 'a shaded mountain forest'],
    LIGHTING: [
      'soft light after rain, sun rays breaking through',
      'soft afternoon shade, dappled sunlight',
      'soft morning mist',
    ],
    SCENE_VIDEO: [
      'a slow forward walk down a shaded wet stone path between tall cedar trees, with wet leaves on the stones and mist lifting between the trees',
    ],
    MAIN_OBJECT: ['tall cedar trees', 'tall green bamboo stalks', 'tall pine trees'],
    ACTION_0_1S: [
      'camera is already moving forward slowly down the path as water drips softly, the sound of drips and birds returning, calm and quiet',
    ],
    ACTION_1_3S: ['a droplet falls from a branch, the cedars sway gently, the walk continues'],
    ACTION_3_7S: [
      'camera moves forward slowly and smoothly, revealing the path curving gently ahead under the same tall cedar trees in soft light after rain, every detail staying the same, in tack-sharp focus',
    ],
    ACTION_7_10S: [
      'the camera settles into a calm wide view of the same path, mist lifting slowly',
    ],
    MOOD: ['Calm, slow, peaceful', 'Calm, slow, fresh', 'Calm, slow, quiet'],
  },
  7: {
    SETTING: ['a quiet Japanese garden ', 'a calm forest stream', 'a shaded mountain stream'],
    LIGHTING: ['soft afternoon shade', 'soft golden afternoon shade', 'soft morning light'],
    SCENE_VIDEO: [
      'red maple branches hanging over a clear stream, red leaves drifting down slowly onto the water',
    ],
    MAIN_OBJECT: [
      'red maple branches over a clear stream',
      'a red maple tree over clear water',
      'red maple leaves on a clear stream',
    ],
    ACTION_0_1S: [
      'camera starts already close on the water as a red leaf lands softly, a ripple spreading, the sound of water over stones, calm and quiet',
    ],
    ACTION_1_3S: ['a second leaf drifts down, the stream flows steadily'],
    ACTION_3_7S: [
      'camera pulls back slowly and smoothly, revealing the stream and the red maple branches above it, every detail staying the same, in tack-sharp focus',
    ],
    ACTION_7_10S: [
      'the camera settles into a calm wide view of the same stream, leaves drifting slowly',
    ],
    MOOD: ['Calm, slow, peaceful', 'Calm, slow, quiet', 'Calm, slow, warm'],
  },
  8: {
    SETTING: ['a quiet Zen garden', 'a calm temple garden ', 'a quiet garden courtyard'],
    LIGHTING: ['soft afternoon shade', 'soft morning light', 'soft evening shade'],
    SCENE_VIDEO: [
      'raked gravel in slow curves with one large stone and one small pine, completely still',
    ],
    MAIN_OBJECT: [
      'raked gravel and one large stone',
      'one large stone and one small pine',
      'a Zen rock garden',
    ],
    ACTION_0_1S: [
      'camera starts already close on the raked gravel as wind moves softly, near-silence, calm and quiet',
    ],
    ACTION_1_3S: ['a single leaf drifts down onto the gravel, nothing else moves'],
    ACTION_3_7S: [
      'camera pulls back slowly and smoothly, revealing the full Zen garden, every detail staying the same, in tack-sharp focus',
    ],
    ACTION_7_10S: [
      'the camera settles into a calm wide view of the same Zen garden, completely still',
    ],
    MOOD: ['Calm, slow, peaceful', 'Calm, slow, meditative', 'Calm, slow, quiet'],
  },
  9: {
    SETTING: ['a quiet Japanese garden ', 'a calm river in a park', 'a shaded garden river'],
    LIGHTING: ['soft afternoon shade, dappled sunlight', 'soft morning light', 'golden hour shade'],
    SCENE_VIDEO: [
      'pink cherry blossom petals drifting downstream in a slow current, shaded banks on both sides',
    ],
    MAIN_OBJECT: [
      'pink cherry blossom petals on a slow river',
      'a slow river with drifting petals',
      'cherry blossom petals drifting downstream',
    ],
    ACTION_0_1S: [
      'camera starts already close on the water as petals drift past slowly, the sound of gentle water, calm and quiet',
    ],
    ACTION_1_3S: ['more petals join the current, the river flows steadily'],
    ACTION_3_7S: [
      'camera pulls back slowly and smoothly, revealing the river and the shaded banks around it, every detail staying the same, in tack-sharp focus',
    ],
    ACTION_7_10S: [
      'the camera settles into a calm wide view of the same river, petals drifting slowly',
    ],
    MOOD: ['Calm, slow, peaceful', 'Calm, slow, quiet', 'Calm, slow, dreamy'],
  },
  10: {
    SETTING: [
      'a misty mountain valley',
      'a quiet mountain valley at dawn',
      'a calm Japanese mountain valley',
    ],
    LIGHTING: ['soft dawn mist, golden sunrise', 'soft morning mist', 'soft golden hour'],
    SCENE_VIDEO: [
      'layered misty mountains with a pagoda in the valley below, a cherry blossom branch in the foreground, soft golden sunrise light',
    ],
    MAIN_OBJECT: [
      'a misty mountain valley with a pagoda',
      'layered misty mountains',
      'a pagoda in a misty valley',
    ],
    ACTION_0_1S: [
      'camera starts already on the valley as mist drifts slowly, near-silence, then one bird, calm and quiet',
    ],
    ACTION_1_3S: ['mist moves gently between the mountains, the pagoda stays still below'],
    ACTION_3_7S: [
      'camera pulls back slowly and smoothly, revealing the full valley and the mountains around it, every detail staying the same, in tack-sharp focus',
    ],
    ACTION_7_10S: [
      'the camera settles into a calm wide view of the same valley, mist drifting slowly',
    ],
    MOOD: ['Calm, slow, peaceful', 'Calm, slow, majestic', 'Calm, slow, quiet'],
  },
};
