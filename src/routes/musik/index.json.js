import songs from './_songs.js';

const contents = JSON.stringify(songs.map(song => {
	return {
		title: song.title,
		slug: song.slug
	};
}));

export function get(req, res) {
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});

	res.end(contents);
}
