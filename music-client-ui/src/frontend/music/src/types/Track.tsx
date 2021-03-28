export interface Track {
    title: string,
    artist: string,
    id: number,
    /**
     * A value from 0-10 indicating the rating of the song. Also can be null if the song is not rated.
     */
    rating: number | null
}